import { type IVerifyingKeyStruct } from "@maci-protocol/contracts";
import { VkRegistry__factory as VkRegistryFactory } from "@maci-protocol/contracts/typechain-types";
import { genPollJoinedVkSig, genPollJoiningVkSig, genProcessVkSig, genTallyVkSig } from "@maci-protocol/core";

import type { ISetVerifyingKeysArgs } from "./types";

import { contractExists } from "../utils";

import { compareVks } from "./utils";

/**
 * Set the verifying keys on the contract
 * @param args - The arguments for the setVerifyingKeys function
 */
export const setVerifyingKeys = async ({
  pollJoiningVk,
  pollJoinedVk,
  processMessagesVks,
  tallyVotesVks,
  stateTreeDepth,
  intStateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
  vkRegistryAddress,
  signer,
  modes,
}: ISetVerifyingKeysArgs): Promise<void> => {
  // validate args
  if (stateTreeDepth < 1 || intStateTreeDepth < 1 || voteOptionTreeDepth < 1 || messageBatchSize < 1) {
    throw new Error("Invalid depth or batch size parameters");
  }

  if (stateTreeDepth < intStateTreeDepth) {
    throw new Error("Invalid state tree depth or intermediate state tree depth");
  }

  const vkRegistryContractExists = await contractExists(signer.provider!, vkRegistryAddress);
  // ensure we have a contract deployed at the provided address
  if (!vkRegistryContractExists) {
    throw new Error(`A VkRegistry contract is not deployed at ${vkRegistryAddress}`);
  }

  // connect to VkRegistry contract
  const vkRegistryContract = VkRegistryFactory.connect(vkRegistryAddress, signer);

  // check if the poll vk was already set
  const pollJoiningVkSig = genPollJoiningVkSig(stateTreeDepth);

  if (await vkRegistryContract.isPollJoiningVkSet(pollJoiningVkSig)) {
    throw new Error("This poll verifying key is already set in the contract");
  }

  // check if the poll vk was already set
  const pollJoinedVkSig = genPollJoinedVkSig(stateTreeDepth);

  if (await vkRegistryContract.isPollJoinedVkSet(pollJoinedVkSig)) {
    throw new Error("This poll verifying key is already set in the contract");
  }

  modes.forEach(async (mode) => {
    // check if the process messages vk was already set
    const processVkSig = genProcessVkSig(stateTreeDepth, voteOptionTreeDepth, messageBatchSize);

    if (await vkRegistryContract.isProcessVkSet(processVkSig, mode)) {
      throw new Error("This process verifying key is already set in the contract");
    }

    // do the same for the tally votes vk
    const tallyVkSig = genTallyVkSig(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth);

    if (await vkRegistryContract.isTallyVkSet(tallyVkSig, mode)) {
      throw new Error("This tally verifying key is already set in the contract");
    }
  });

  // set them onchain
  const tx = await vkRegistryContract.setVerifyingKeysBatch(
    stateTreeDepth,
    intStateTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    modes,
    pollJoiningVk.asContractParam() as IVerifyingKeyStruct,
    pollJoinedVk.asContractParam() as IVerifyingKeyStruct,
    processMessagesVks.map((vk) => vk.asContractParam()) as IVerifyingKeyStruct[],
    tallyVotesVks.map((vk) => vk.asContractParam()) as IVerifyingKeyStruct[],
  );

  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("Set verifying keys transaction failed");
  }

  const [pollJoiningVkOnChain, pollJoinedVkOnChain] = await Promise.all([
    vkRegistryContract.getPollJoiningVk(stateTreeDepth),
    vkRegistryContract.getPollJoinedVk(stateTreeDepth),
  ]);

  if (!compareVks(pollJoiningVkOnChain, pollJoiningVk)) {
    throw new Error("pollJoiningVk mismatch");
  }

  if (!compareVks(pollJoinedVkOnChain, pollJoinedVk)) {
    throw new Error("pollJoinedVk mismatch");
  }

  modes.forEach(async (mode, i) => {
    const [processVkOnChain, tallyVkOnChain] = await Promise.all([
      vkRegistryContract.getProcessVk(stateTreeDepth, voteOptionTreeDepth, messageBatchSize, mode),
      vkRegistryContract.getTallyVk(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth, mode),
    ]);

    if (!compareVks(processVkOnChain, processMessagesVks[i])) {
      throw new Error("processVk mismatch");
    }

    if (!compareVks(tallyVkOnChain, tallyVotesVks[i])) {
      throw new Error("tallyVk mismatch");
    }
  });
};
