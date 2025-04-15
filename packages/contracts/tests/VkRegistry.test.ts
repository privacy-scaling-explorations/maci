import { expect } from "chai";
import { Signer } from "ethers";

import { IVerifyingKeyStruct, VkRegistry, deployVkRegistry, getDefaultSigner } from "../ts";
import { EMode } from "../ts/constants";

import {
  messageBatchSize,
  testPollJoinedVk,
  testPollJoiningVk,
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
  const pollStateTreeDepth = 10;

  describe("deployment", () => {
    before(async () => {
      signer = await getDefaultSigner();
      vkRegistryContract = await deployVkRegistry(signer, true);
    });

    it("should have set the correct owner", async () => {
      expect(await vkRegistryContract.owner()).to.eq(await signer.getAddress());
    });
  });

  describe("setPollJoiningVkKey", () => {
    it("should set the poll vk", async () => {
      const tx = await vkRegistryContract.setPollJoiningVkKey(
        stateTreeDepth + 1,
        testPollJoiningVk.asContractParam() as IVerifyingKeyStruct,
        { gasLimit: 1000000 },
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should throw when trying to set another vk for the same params", async () => {
      await expect(
        vkRegistryContract.setPollJoiningVkKey(
          stateTreeDepth + 1,
          testPollJoiningVk.asContractParam() as IVerifyingKeyStruct,
          { gasLimit: 1000000 },
        ),
      ).to.be.revertedWithCustomError(vkRegistryContract, "VkAlreadySet");
    });
  });

  describe("setPollJoinedVkKey", () => {
    it("should set the poll vk", async () => {
      const tx = await vkRegistryContract.setPollJoinedVkKey(
        stateTreeDepth + 1,
        testPollJoinedVk.asContractParam() as IVerifyingKeyStruct,
        { gasLimit: 1000000 },
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should throw when trying to set another vk for the same params", async () => {
      await expect(
        vkRegistryContract.setPollJoinedVkKey(
          stateTreeDepth + 1,
          testPollJoinedVk.asContractParam() as IVerifyingKeyStruct,
          { gasLimit: 1000000 },
        ),
      ).to.be.revertedWithCustomError(vkRegistryContract, "VkAlreadySet");
    });
  });

  describe("setVerifyingKeys", () => {
    it("should set the process, tally vks", async () => {
      const tx = await vkRegistryContract.setVerifyingKeys(
        stateTreeDepth,
        treeDepths.intStateTreeDepth,
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
          treeDepths.voteOptionTreeDepth,
          messageBatchSize,
          EMode.QV,
          testProcessVk.asContractParam() as IVerifyingKeyStruct,
          testTallyVk.asContractParam() as IVerifyingKeyStruct,
        ),
      ).to.be.revertedWithCustomError(vkRegistryContract, "VkAlreadySet");
    });

    it("should allow to set vks for different params", async () => {
      const tx = await vkRegistryContract.setVerifyingKeys(
        stateTreeDepth + 1,
        treeDepths.intStateTreeDepth,
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
    it("should set the process, tally, poll vks", async () => {
      const tx = await vkRegistryContract.setVerifyingKeysBatch({
        stateTreeDepth,
        pollStateTreeDepth,
        intStateTreeDepth: treeDepths.intStateTreeDepth,
        voteOptionTreeDepth: treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        modes: [EMode.NON_QV],
        pollJoiningVk: testPollJoiningVk.asContractParam() as IVerifyingKeyStruct,
        pollJoinedVk: testPollJoinedVk.asContractParam() as IVerifyingKeyStruct,
        processVks: [testProcessVkNonQv.asContractParam() as IVerifyingKeyStruct],
        tallyVks: [testTallyVkNonQv.asContractParam() as IVerifyingKeyStruct],
      });

      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should throw when zkeys doesn't have the same length", async () => {
      await expect(
        vkRegistryContract.setVerifyingKeysBatch({
          stateTreeDepth,
          pollStateTreeDepth,
          intStateTreeDepth: treeDepths.intStateTreeDepth,
          voteOptionTreeDepth: treeDepths.voteOptionTreeDepth,
          messageBatchSize,
          modes: [EMode.QV],
          pollJoiningVk: testPollJoiningVk.asContractParam() as IVerifyingKeyStruct,
          pollJoinedVk: testPollJoinedVk.asContractParam() as IVerifyingKeyStruct,
          processVks: [
            testProcessVk.asContractParam() as IVerifyingKeyStruct,
            testProcessVkNonQv.asContractParam() as IVerifyingKeyStruct,
          ],
          tallyVks: [testTallyVk.asContractParam() as IVerifyingKeyStruct],
        }),
      ).to.be.revertedWithCustomError(vkRegistryContract, "InvalidKeysParams");
    });
  });

  describe("hasVks", () => {
    describe("hasProcessVk", () => {
      it("should return true for the process vk", async () => {
        expect(
          await vkRegistryContract.hasProcessVk(
            stateTreeDepth,
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
    describe("genPollJoiningVkSig", () => {
      it("should generate a valid signature", async () => {
        const sig = await vkRegistryContract.genPollJoiningVkSig(pollStateTreeDepth);
        const vk = await vkRegistryContract.getPollJoiningVkBySig(sig);
        compareVks(testPollJoiningVk, vk);
      });
    });

    describe("genPollJoinedVkSig", () => {
      it("should generate a valid signature", async () => {
        const sig = await vkRegistryContract.genPollJoinedVkSig(pollStateTreeDepth);
        const vk = await vkRegistryContract.getPollJoinedVkBySig(sig);
        compareVks(testPollJoinedVk, vk);
      });
    });

    describe("genProcessVkSig", () => {
      it("should generate a valid signature", async () => {
        const sig = await vkRegistryContract.genProcessVkSig(
          stateTreeDepth,
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
