import { expect } from "chai";
import { AbiCoder, Signer, ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deploySemaphoreGatekeeper, deployContract } from "../ts/deploy";
import { getDefaultSigner, getSigners } from "../ts/utils";
import { MACI, SemaphoreGatekeeper, MockSemaphore } from "../typechain-types";

import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "./constants";
import { deployTestContracts } from "./utils";

describe("Semaphore Gatekeeper", () => {
  let semaphoreGatekeeper: SemaphoreGatekeeper;
  let mockSemaphore: MockSemaphore;
  let signer: Signer;
  let signerAddress: string;

  const user = new Keypair();

  const validGroupId = 0n;
  const invalidGroupId = 1n;

  const proof = {
    merkleTreeDepth: 1n,
    merkleTreeRoot: 0n,
    nullifier: 0n,
    message: 0n,
    scope: validGroupId,
    points: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n],
  };

  const invalidProof = {
    merkleTreeDepth: 1n,
    merkleTreeRoot: 0n,
    nullifier: 0n,
    message: 0n,
    scope: invalidGroupId,
    points: [1n, 0n, 0n, 0n, 0n, 0n, 0n, 0n],
  };

  const encodedProof = AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256[8]"],
    [proof.merkleTreeDepth, proof.merkleTreeRoot, proof.nullifier, proof.message, proof.scope, proof.points],
  );

  const encodedProofInvalidGroupId = AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256[8]"],
    [proof.merkleTreeDepth, proof.merkleTreeRoot, proof.nullifier, proof.message, invalidGroupId, proof.points],
  );

  const encodedInvalidProof = AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256[8]"],
    [
      invalidProof.merkleTreeDepth,
      invalidProof.merkleTreeRoot,
      invalidProof.nullifier,
      invalidProof.message,
      validGroupId,
      invalidProof.points,
    ],
  );

  before(async () => {
    signer = await getDefaultSigner();
    mockSemaphore = await deployContract("MockSemaphore", signer, true, validGroupId);
    const mockSemaphoreAddress = await mockSemaphore.getAddress();
    signerAddress = await signer.getAddress();
    semaphoreGatekeeper = await deploySemaphoreGatekeeper(mockSemaphoreAddress, validGroupId, signer, true);
  });

  describe("Deployment", () => {
    it("The gatekeeper should be deployed correctly", () => {
      expect(semaphoreGatekeeper).to.not.eq(undefined);
    });
  });

  describe("Gatekeeper", () => {
    let maciContract: MACI;

    before(async () => {
      const r = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: STATE_TREE_DEPTH,
        signer,
        gatekeeper: semaphoreGatekeeper,
      });

      maciContract = r.maciContract;
    });

    it("sets MACI instance correctly", async () => {
      const maciAddress = await maciContract.getAddress();
      await semaphoreGatekeeper.setMaciInstance(maciAddress).then((tx) => tx.wait());

      expect(await semaphoreGatekeeper.maci()).to.eq(maciAddress);
    });

    it("should fail to set MACI instance when the caller is not the owner", async () => {
      const [, secondSigner] = await getSigners();
      await expect(
        semaphoreGatekeeper.connect(secondSigner).setMaciInstance(signerAddress),
      ).to.be.revertedWithCustomError(semaphoreGatekeeper, "OwnableUnauthorizedAccount");
    });

    it("should fail to set MACI instance when the MACI instance is not valid", async () => {
      await expect(semaphoreGatekeeper.setMaciInstance(ZeroAddress)).to.be.revertedWithCustomError(
        semaphoreGatekeeper,
        "ZeroAddress",
      );
    });

    it("should not register a user if the register function is called with invalid groupId", async () => {
      await semaphoreGatekeeper.setMaciInstance(await maciContract.getAddress()).then((tx) => tx.wait());

      await expect(
        maciContract.signUp(
          user.pubKey.asContractParam(),
          encodedProofInvalidGroupId,
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
        ),
      ).to.be.revertedWithCustomError(semaphoreGatekeeper, "InvalidGroup");
    });

    it("should revert if the proof is invalid (mock)", async () => {
      await mockSemaphore.flipValid();
      await expect(
        maciContract.signUp(
          user.pubKey.asContractParam(),
          encodedInvalidProof,
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
        ),
      ).to.be.revertedWithCustomError(semaphoreGatekeeper, "InvalidProof");
      await mockSemaphore.flipValid();
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
      ).to.be.revertedWithCustomError(semaphoreGatekeeper, "AlreadyRegistered");
    });
  });
});
