import { expect } from "chai";
import { AbiCoder, Signer, ZeroAddress, encodeBytes32String } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deployContract } from "../ts/deploy";
import { getDefaultSigner, getSigners } from "../ts/utils";
import { MerkleProofGatekeeper, MACI } from "../typechain-types";

import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "./constants";
import { deployTestContracts } from "./utils";

describe("MerkleProof Gatekeeper", () => {
  let merkleProofGatekeeper: MerkleProofGatekeeper;
  let signer: Signer;
  let signerAddress: string;

  const root = "0xfa6f66f1be66f2815b61179f5bd043b6839ac27cc1c8a0e20dd4400d89d90861";
  const invalidRoot = encodeBytes32String("");
  const validProof = [
    "0xc65a4d494d5b974c8114f7ba4ae9081d0749b8d65119343a5f985822e15c8da1",
    "0x39947c197009ff867a25c375bcc13beca66c7563d245e9d3a8c27ed20f5a1924",
    "0x6b9eb4531492f03c01e616823bbc4fecbe264dce549d622150f422e341c0923a",
    "0x90c638228d7b7880a9366d6253944af00e83f30147b3e38df6420dc246f81c22",
    "0x167658642d62274440db47e688cce708eeb068e63e8b1a30068aa16afde5b799",
    "0x53253f8482986107dde4e9aa1ac16c25bca9fe12261bb38f8ff647ab3b15d4da",
    "0x7cb1946ff766827d71b942d2e7e8a03b5153c7526b309513bb335de63ca8b37f",
    "0x88cf65a418b67f086e6b44dc6179aacff7638c2eb2b5793d829a5259ef7b0b08",
    "0x11dc42813498e23ccb198ca8ad75c62d9006367d71b8232dff8beb0ddac61e58",
    "0x3647c988dd6073eb730d74dbbf723908ee5a6a65ae4568b1a8eaa3cb10048854",
    "0xbd85ee8d862baccee1c3dd36f038f485460effd932a7724e13e8b959613aee0a",
  ];
  const invalidProof = [
    "0xc65a4d494d5b974c8114f7ba4ae9081d0749b8d65119343a5f985822e15c8da1",
    "0x39947c197009ff867a25c375bcc13beca66c7563d245e9d3a8c27ed20f5a1924",
    "0x6b9eb4531492f03c01e616823bbc4fecbe264dce549d622150f422e341c0923a",
    "0x90c638228d7b7880a9366d6253944af00e83f30147b3e38df6420dc246f81c22",
    "0x167658642d62274440db47e688cce708eeb068e63e8b1a30068aa16afde5b799",
    "0x53253f8482986107dde4e9aa1ac16c25bca9fe12261bb38f8ff647ab3b15d4da",
    "0x7cb1946ff766827d71b942d2e7e8a03b5153c7526b309513bb335de63ca8b37f",
    "0x88cf65a418b67f086e6b44dc6179aacff7638c2eb2b5793d829a5259ef7b0b08",
    "0x11dc42813498e23ccb198ca8ad75c62d9006367d71b8232dff8beb0ddac61e58",
    "0x3647c988dd6073eb730d74dbbf723908ee5a6a65ae4568b1a8eaa3cb10048854",
    "0x00000000000000fa6f66f1be66f2815b61179f5bd043b6839ac0000000000000",
  ];

  const user = new Keypair();

  before(async () => {
    signer = await getDefaultSigner();
    signerAddress = await signer.getAddress();
    merkleProofGatekeeper = await deployContract("MerkleProofGatekeeper", signer, true, root);
  });

  describe("Deployment", () => {
    it("The gatekeeper should be deployed correctly", async () => {
      expect(merkleProofGatekeeper).to.not.eq(undefined);
      expect(await merkleProofGatekeeper.getAddress()).to.not.eq(ZeroAddress);
    });

    it("should fail to deploy when the root is not valid", async () => {
      await expect(deployContract("MerkleProofGatekeeper", signer, true, invalidRoot)).to.be.revertedWithCustomError(
        merkleProofGatekeeper,
        "InvalidRoot",
      );
    });
  });

  describe("MerkleProofGatekeeper", () => {
    let maciContract: MACI;

    before(async () => {
      const r = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: STATE_TREE_DEPTH,
        signer,
        gatekeeper: merkleProofGatekeeper,
      });

      maciContract = r.maciContract;
    });

    it("sets MACI instance correctly", async () => {
      const maciAddress = await maciContract.getAddress();
      await merkleProofGatekeeper.setMaciInstance(maciAddress).then((tx) => tx.wait());

      expect(await merkleProofGatekeeper.maci()).to.eq(maciAddress);
    });

    it("should fail to set MACI instance when the caller is not the owner", async () => {
      const [, secondSigner] = await getSigners();
      await expect(
        merkleProofGatekeeper.connect(secondSigner).setMaciInstance(signerAddress),
      ).to.be.revertedWithCustomError(merkleProofGatekeeper, "OwnableUnauthorizedAccount");
    });

    it("should fail to set MACI instance when the MACI instance is not valid", async () => {
      await expect(merkleProofGatekeeper.setMaciInstance(ZeroAddress)).to.be.revertedWithCustomError(
        merkleProofGatekeeper,
        "ZeroAddress",
      );
    });

    it("should throw when the proof is invalid)", async () => {
      await merkleProofGatekeeper.setMaciInstance(signerAddress).then((tx) => tx.wait());

      await expect(
        merkleProofGatekeeper.register(signerAddress, AbiCoder.defaultAbiCoder().encode(["bytes32[]"], [invalidProof])),
      ).to.be.revertedWithCustomError(merkleProofGatekeeper, "InvalidProof");
    });

    it("should register a user if the register function is called with the valid data", async () => {
      await merkleProofGatekeeper.setMaciInstance(await maciContract.getAddress()).then((tx) => tx.wait());

      // signup via MACI
      const tx = await maciContract.signUp(
        user.pubKey.asContractParam(),
        AbiCoder.defaultAbiCoder().encode(["bytes32[]"], [validProof]),
        AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
      );

      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);
    });

    it("should prevent signing up twice", async () => {
      await expect(
        maciContract.signUp(
          user.pubKey.asContractParam(),
          AbiCoder.defaultAbiCoder().encode(["bytes32[]"], [validProof]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
        ),
      ).to.be.revertedWithCustomError(merkleProofGatekeeper, "AlreadyRegistered");
    });
  });
});
