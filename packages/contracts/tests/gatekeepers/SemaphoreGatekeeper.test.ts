import { expect } from "chai";
import { AbiCoder, Signer, ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deploySemaphoreSignupGatekeeper, deployContract } from "../../ts/deploy";
import { getDefaultSigner, getSigners } from "../../ts/utils";
import { MACI, SemaphoreGatekeeper, MockSemaphore, SemaphoreChecker } from "../../typechain-types";
import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "../constants";
import { deployTestContracts } from "../utils";

describe("Semaphore Gatekeeper", () => {
  let semaphoreGatekeeper: SemaphoreGatekeeper;
  let semaphoreChecker: SemaphoreChecker;
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

  const encodedProofInvalidGroupId = AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256[8]"],
    [proof.merkleTreeDepth, proof.merkleTreeRoot, proof.nullifier, proof.message, invalidGroupId, proof.points],
  );

  before(async () => {
    signer = await getDefaultSigner();
    mockSemaphore = await deployContract("MockSemaphore", signer, true, validGroupId);
    const mockSemaphoreAddress = await mockSemaphore.getAddress();
    signerAddress = await signer.getAddress();

    // eslint-disable-next-line no-bitwise
    proof.scope = (BigInt(signerAddress) << 96n) | validGroupId;

    [semaphoreGatekeeper, semaphoreChecker] = await deploySemaphoreSignupGatekeeper(
      { semaphore: mockSemaphoreAddress, groupId: validGroupId },
      signer,
      true,
    );
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

    it("should set guarded target correctly", async () => {
      const maciAddress = await maciContract.getAddress();
      await semaphoreGatekeeper.setTarget(maciAddress).then((tx) => tx.wait());

      expect(await semaphoreGatekeeper.guarded()).to.eq(maciAddress);
    });

    it("should fail to set guarded target when the caller is not the owner", async () => {
      const [, secondSigner] = await getSigners();
      await expect(semaphoreGatekeeper.connect(secondSigner).setTarget(signerAddress)).to.be.revertedWithCustomError(
        semaphoreGatekeeper,
        "OwnableUnauthorizedAccount",
      );
    });

    it("should fail to set guarded target when the MACI instance is not valid", async () => {
      await expect(semaphoreGatekeeper.setTarget(ZeroAddress)).to.be.revertedWithCustomError(
        semaphoreGatekeeper,
        "ZeroAddress",
      );
    });

    it("should not register a user if the register function is called with invalid groupId", async () => {
      await expect(
        maciContract.signUp(user.pubKey.asContractParam(), encodedProofInvalidGroupId),
      ).to.be.revertedWithCustomError(semaphoreChecker, "InvalidGroup");
    });

    it("should revert if the proof is invalid (mock)", async () => {
      const encodedInvalidProof = AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256[8]"],
        [
          invalidProof.merkleTreeDepth,
          invalidProof.merkleTreeRoot,
          invalidProof.nullifier,
          invalidProof.message,
          proof.scope,
          invalidProof.points,
        ],
      );

      await mockSemaphore.flipValid();
      await expect(
        maciContract.signUp(user.pubKey.asContractParam(), encodedInvalidProof),
      ).to.be.revertedWithCustomError(semaphoreChecker, "InvalidProof");
      await mockSemaphore.flipValid();
    });

    it("should register a user if the register function is called with the valid data", async () => {
      const encodedProof = AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256[8]"],
        [proof.merkleTreeDepth, proof.merkleTreeRoot, proof.nullifier, proof.message, proof.scope, proof.points],
      );

      const tx = await maciContract.signUp(user.pubKey.asContractParam(), encodedProof);

      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);
    });

    it("should prevent signing up twice", async () => {
      const encodedProof = AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256[8]"],
        [proof.merkleTreeDepth, proof.merkleTreeRoot, proof.nullifier, proof.message, proof.scope, proof.points],
      );

      await expect(maciContract.signUp(user.pubKey.asContractParam(), encodedProof)).to.be.revertedWithCustomError(
        semaphoreGatekeeper,
        "AlreadyRegistered",
      );
    });
  });
});
