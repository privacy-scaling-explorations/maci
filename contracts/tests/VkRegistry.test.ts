import { expect } from "chai";
import { Signer } from "ethers";

import { IVerifyingKeyStruct, VkRegistry, deployVkRegistry, getDefaultSigner } from "../ts";

import { messageBatchSize, testProcessVk, testTallyVk, treeDepths } from "./constants";
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
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
        { gasLimit: 1000000 },
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
          testProcessVk.asContractParam() as IVerifyingKeyStruct,
          testTallyVk.asContractParam() as IVerifyingKeyStruct,
          { gasLimit: 1000000 },
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
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
        { gasLimit: 1000000 },
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should allow to set the subsidy vks", async () => {
      const tx = await vkRegistryContract.setSubsidyKeys(
        stateTreeDepth,
        treeDepths.intStateTreeDepth,
        treeDepths.voteOptionTreeDepth,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        { gasLimit: 1000000 },
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
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
          ),
        ).to.eq(true);
      });
      it("should return false for a non-existing vk", async () => {
        expect(
          await vkRegistryContract.hasTallyVk(
            stateTreeDepth + 2,
            treeDepths.intStateTreeDepth,
            treeDepths.voteOptionTreeDepth,
          ),
        ).to.eq(false);
      });
    });

    describe("hasSubsidyVk", () => {
      it("should return true for the subsidy vk", async () => {
        expect(
          await vkRegistryContract.hasSubsidyVk(
            stateTreeDepth,
            treeDepths.intStateTreeDepth,
            treeDepths.voteOptionTreeDepth,
          ),
        ).to.eq(true);
      });
      it("should return false for a non-existing vk", async () => {
        expect(
          await vkRegistryContract.hasSubsidyVk(
            stateTreeDepth + 2,
            treeDepths.intStateTreeDepth,
            treeDepths.voteOptionTreeDepth,
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
        const vk = await vkRegistryContract.getProcessVkBySig(sig);
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
        const vk = await vkRegistryContract.getTallyVkBySig(sig);
        compareVks(testTallyVk, vk);
      });
    });

    describe("genSubsidyVkSig", () => {
      it("should generate a valid signature", async () => {
        const sig = await vkRegistryContract.genSubsidyVkSig(
          stateTreeDepth,
          treeDepths.intStateTreeDepth,
          treeDepths.voteOptionTreeDepth,
        );
        const vk = await vkRegistryContract.getSubsidyVkBySig(sig);
        compareVks(testProcessVk, vk);
      });
    });
  });
});
