import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { expect } from "chai";
import { AbiCoder, Signer, ZeroAddress, encodeBytes32String } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deployContract } from "../ts/deploy";
import { getDefaultSigner, getSigners, generateMerkleTree } from "../ts/utils";
import { MerkleProofGatekeeper, MACI } from "../typechain-types";

import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "./constants";
import { deployTestContracts } from "./utils";

describe("MerkleProof Gatekeeper", () => {
  let merkleProofGatekeeper: MerkleProofGatekeeper;
  let signer: Signer;
  let signerAddress: string;
  let tree: StandardMerkleTree<string[]>;
  let validProof: string[];

  const allowedAddress = [
    ["0x2fbca3862a7d99486c61e0275b6f5660180fb1b3"],
    ["0x70564145fa8e8a15348ef0190e6b7c07a2120462"],
    ["0x27cfc88640089f340aeaec182baff0ddf15b1b37"],
    ["0xccde65cf4e39a2d28b50e3030fdab60c463fe215"],
    ["0x9bae2cfa33280a8332da9a3bd589f91935b12804"],
  ];

  const invalidRoot = encodeBytes32String("");
  const invalidProof = ["0x0000000000000000000000000000000000000000000000000000000000000000"];

  const user = new Keypair();

  before(async () => {
    signer = await getDefaultSigner();
    signerAddress = await signer.getAddress();
    allowedAddress.push([signerAddress]);
    tree = generateMerkleTree(allowedAddress);
    merkleProofGatekeeper = await deployContract("MerkleProofGatekeeper", signer, true, tree.root);
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
      validProof = tree.getProof([signerAddress]);
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
