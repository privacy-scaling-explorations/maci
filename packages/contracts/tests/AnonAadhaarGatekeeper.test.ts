import { expect } from "chai";
import { AbiCoder, Signer, ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deployAnonAadhaarGatekeeper, deployContract } from "../ts/deploy";
import { getDefaultSigner, getSigners } from "../ts/utils";
import { MACI, AnonAadhaarGatekeeper, MockAnonAadhaar } from "../typechain-types";

import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "./constants";
import { deployTestContracts } from "./utils";

describe("AnonAadhaar Gatekeeper", () => {
  let anonAadhaarGatekeeper: AnonAadhaarGatekeeper;
  let mockAnonAadhaar: MockAnonAadhaar;
  let signer: Signer;
  let signerAddressUint256: bigint;
  let signerAddress: string;
  let encodedProof: string;

  const user = new Keypair();

  // Define the constant nullifierSeed
  const nullifierSeed = 1234;

  // Mock AnonAadhaar proof
  const mockProof = {
    timestamp: Math.floor(new Date().getTime() / 1000) - 2 * 60 * 60,
    nullifierSeed: nullifierSeed.toString(),
    nullifier: "7946664694698614794431553425553810756961743235367295886353548733878558886762",
    ageAbove18: "1",
    gender: "77",
    pincode: "110051",
    state: "452723500356",
    packedGroth16Proof: ["0", "1", "2", "3", "4", "5", "6", "7"],
  };

  before(async () => {
    signer = await getDefaultSigner();
    mockAnonAadhaar = await deployContract("MockAnonAadhaar", signer, true);
    const mockAnonAadhaarAddress = await mockAnonAadhaar.getAddress();
    signerAddress = await signer.getAddress();
    anonAadhaarGatekeeper = await deployAnonAadhaarGatekeeper(mockAnonAadhaarAddress, nullifierSeed, signer, true);
    signerAddressUint256 = BigInt(signerAddress);
    encodedProof = AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256", "uint256", "uint256", "uint256[4]", "uint256[8]"],
      [
        mockProof.nullifierSeed,
        mockProof.nullifier,
        mockProof.timestamp,
        signerAddressUint256,
        [mockProof.ageAbove18, mockProof.gender, mockProof.pincode, mockProof.state],
        mockProof.packedGroth16Proof,
      ],
    );
  });

  describe("Deployment", () => {
    it("The gatekeeper should be deployed correctly", () => {
      expect(anonAadhaarGatekeeper).to.not.eq(undefined);
    });
  });

  describe("Gatekeeper", () => {
    let maciContract: MACI;

    before(async () => {
      const r = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: STATE_TREE_DEPTH,
        signer,
        gatekeeper: anonAadhaarGatekeeper,
      });

      maciContract = r.maciContract;
    });

    it("sets MACI instance correctly", async () => {
      const maciAddress = await maciContract.getAddress();
      await anonAadhaarGatekeeper.setMaciInstance(maciAddress).then((tx) => tx.wait());

      expect(await anonAadhaarGatekeeper.maci()).to.eq(maciAddress);
    });

    it("should fail to set MACI instance when the caller is not the owner", async () => {
      const [, secondSigner] = await getSigners();
      await expect(
        anonAadhaarGatekeeper.connect(secondSigner).setMaciInstance(signerAddress),
      ).to.be.revertedWithCustomError(anonAadhaarGatekeeper, "OwnableUnauthorizedAccount");
    });

    it("should fail to set MACI instance when the MACI instance is not valid", async () => {
      await expect(anonAadhaarGatekeeper.setMaciInstance(ZeroAddress)).to.be.revertedWithCustomError(
        anonAadhaarGatekeeper,
        "ZeroAddress",
      );
    });

    it("should revert if the nullifier seed is invalid", async () => {
      const invalidNullifierSeedProof = {
        ...mockProof,
        nullifierSeed: "5678",
      };

      const encodedInvalidNullifierSeedProof = AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256", "uint256[4]", "uint256[8]"],
        [
          invalidNullifierSeedProof.nullifierSeed,
          invalidNullifierSeedProof.nullifier,
          invalidNullifierSeedProof.timestamp,
          signerAddressUint256,
          [
            invalidNullifierSeedProof.ageAbove18,
            invalidNullifierSeedProof.gender,
            invalidNullifierSeedProof.pincode,
            invalidNullifierSeedProof.state,
          ],
          invalidNullifierSeedProof.packedGroth16Proof,
        ],
      );

      await expect(
        maciContract.signUp(
          user.pubKey.asContractParam(),
          encodedInvalidNullifierSeedProof,
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
        ),
      ).to.be.revertedWithCustomError(anonAadhaarGatekeeper, "InvalidNullifierSeed");
    });

    it("should revert if the signal is invalid", async () => {
      const encodedInvalidProof = AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256", "uint256[4]", "uint256[8]"],
        [
          mockProof.nullifierSeed,
          mockProof.nullifier,
          mockProof.timestamp,
          BigInt(ZeroAddress),
          [mockProof.ageAbove18, mockProof.gender, mockProof.pincode, mockProof.state],
          mockProof.packedGroth16Proof,
        ],
      );
      await expect(
        maciContract.signUp(
          user.pubKey.asContractParam(),
          encodedInvalidProof,
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        ),
      ).to.be.revertedWithCustomError(anonAadhaarGatekeeper, "InvalidSignal");
    });

    it("should revert if the proof is invalid (mock)", async () => {
      await mockAnonAadhaar.flipValid();
      await expect(
        maciContract.signUp(
          user.pubKey.asContractParam(),
          encodedProof,
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
        ),
      ).to.be.revertedWithCustomError(anonAadhaarGatekeeper, "InvalidProof");
      await mockAnonAadhaar.flipValid();
    });

    it("should register a user if the register function is called with the valid data", async () => {
      const tx = await maciContract.signUp(
        user.pubKey.asContractParam(),
        encodedProof,
        AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
      );

      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);
    });

    it("should prevent signing up twice", async () => {
      await expect(
        maciContract.signUp(
          user.pubKey.asContractParam(),
          encodedProof,
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
        ),
      ).to.be.revertedWithCustomError(anonAadhaarGatekeeper, "AlreadyRegistered");
    });
  });
});
