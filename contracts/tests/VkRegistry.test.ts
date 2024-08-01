import { expect } from "chai";
import { Signer } from "ethers";

import { IVerifyingKeyStruct, VkRegistry, deployVkRegistry, getDefaultSigner } from "../ts";
import { EMode } from "../ts/constants";

import {
  messageBatchSize,
  testProcessVk,
  testProcessVkNonQv,
  testTallyVk,
  testTallyVkNonQv,
  treeDepths,
} from "./constants";
import { compareVks } from "./utils";

describe("VkRegistry", () => {
  let signer: Signer;
  let vkRegistryContract: VkRegistry;

  const stateTreeDepth = 10;

  describe("deployment", () => {
    before(async () => {
      signer = await getDefaultSigner();
      vkRegistryContract = await deployVkRegistry(signer, true);
    });

    it("should have set the correct owner", async () => {
      expect(await vkRegistryContract.owner()).to.eq(await signer.getAddress());
    });
  });

  describe("setVerifyingKeys", () => {
    it("should set the process and tally vks", async () => {
      const tx = await vkRegistryContract.setVerifyingKeys(
        stateTreeDepth,
        treeDepths.intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        EMode.QV,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should throw when trying to set another vk for the same params", async () => {
      await expect(
        vkRegistryContract.setVerifyingKeys(
          stateTreeDepth,
          treeDepths.intStateTreeDepth,
          treeDepths.messageTreeDepth,
          treeDepths.voteOptionTreeDepth,
          messageBatchSize,
          EMode.QV,
          testProcessVk.asContractParam() as IVerifyingKeyStruct,
          testTallyVk.asContractParam() as IVerifyingKeyStruct,
        ),
      ).to.be.revertedWithCustomError(vkRegistryContract, "ProcessVkAlreadySet");
    });

    it("should allow to set vks for different params", async () => {
      const tx = await vkRegistryContract.setVerifyingKeys(
        stateTreeDepth + 1,
        treeDepths.intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        EMode.QV,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should allow to set vks for different modes", async () => {
      const tx = await vkRegistryContract.setVerifyingKeys(
        stateTreeDepth + 1,
        treeDepths.intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        EMode.NON_QV,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });
  });

  describe("setVerifyingKeysBatch", () => {
    it("should set the process and tally vks", async () => {
      const tx = await vkRegistryContract.setVerifyingKeysBatch(
        stateTreeDepth,
        treeDepths.intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        [EMode.NON_QV],
        [testProcessVkNonQv.asContractParam() as IVerifyingKeyStruct],
        [testTallyVkNonQv.asContractParam() as IVerifyingKeyStruct],
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should throw when zkeys doesn't have the same length", async () => {
      await expect(
        vkRegistryContract.setVerifyingKeysBatch(
          stateTreeDepth,
          treeDepths.intStateTreeDepth,
          treeDepths.messageTreeDepth,
          treeDepths.voteOptionTreeDepth,
          messageBatchSize,
          [EMode.QV],
          [
            testProcessVk.asContractParam() as IVerifyingKeyStruct,
            testProcessVkNonQv.asContractParam() as IVerifyingKeyStruct,
          ],
          [testTallyVk.asContractParam() as IVerifyingKeyStruct],
        ),
      ).to.be.revertedWithCustomError(vkRegistryContract, "InvalidKeysParams");
    });
  });

  describe("hasVks", () => {
    describe("hasProcessVk", () => {
      it("should return true for the process vk", async () => {
        expect(
          await vkRegistryContract.hasProcessVk(
            stateTreeDepth,
            treeDepths.messageTreeDepth,
            treeDepths.voteOptionTreeDepth,
            messageBatchSize,
            EMode.QV,
          ),
        ).to.eq(true);
      });

      it("should return false for a non-existing vk", async () => {
        expect(
          await vkRegistryContract.hasProcessVk(
            stateTreeDepth + 2,
            treeDepths.messageTreeDepth,
            treeDepths.voteOptionTreeDepth,
            messageBatchSize,
            EMode.QV,
          ),
        ).to.eq(false);
      });
    });

    describe("hasTallyVk", () => {
      it("should return true for the tally vk", async () => {
        expect(
          await vkRegistryContract.hasTallyVk(
            stateTreeDepth,
            treeDepths.intStateTreeDepth,
            treeDepths.voteOptionTreeDepth,
            EMode.QV,
          ),
        ).to.eq(true);
      });

      it("should return false for a non-existing vk", async () => {
        expect(
          await vkRegistryContract.hasTallyVk(
            stateTreeDepth + 2,
            treeDepths.intStateTreeDepth,
            treeDepths.voteOptionTreeDepth,
            EMode.QV,
          ),
        ).to.eq(false);
      });
    });
  });

  describe("genSignatures", () => {
    describe("genProcessVkSig", () => {
      it("should generate a valid signature", async () => {
        const sig = await vkRegistryContract.genProcessVkSig(
          stateTreeDepth,
          treeDepths.messageTreeDepth,
          treeDepths.voteOptionTreeDepth,
          messageBatchSize,
        );
        const vk = await vkRegistryContract.getProcessVkBySig(sig, EMode.QV);
        compareVks(testProcessVk, vk);
      });
    });

    describe("genTallyVkSig", () => {
      it("should generate a valid signature", async () => {
        const sig = await vkRegistryContract.genTallyVkSig(
          stateTreeDepth,
          treeDepths.intStateTreeDepth,
          treeDepths.voteOptionTreeDepth,
        );
        const vk = await vkRegistryContract.getTallyVkBySig(sig, EMode.QV);
        compareVks(testTallyVk, vk);
      });
    });
  });
});
