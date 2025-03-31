import { EMode } from "@maci-protocol/contracts";

import fs from "fs";

import type { ICheckVerifyingKeysArgs } from "./types";

import { contractExists } from "../utils";

import { compareVks, extractAllVks, getAllOnChainVks } from "./utils";

/**
 * Command to confirm that the verifying keys in the contract match the
 * local ones
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param CheckVerifyingKeysArgs - The arguments for the checkVerifyingKeys command
 * @returns Whether the verifying keys match or not
 */
export const checkVerifyingKeys = async ({
  stateTreeDepth,
  intStateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
  processMessagesZkeyPath,
  tallyVotesZkeyPath,
  pollJoiningZkeyPath,
  pollJoinedZkeyPath,
  vkRegistry,
  signer,
  useQuadraticVoting = true,
}: ICheckVerifyingKeysArgs): Promise<boolean> => {
  if (!vkRegistry) {
    throw new Error("Please provide a VkRegistry contract address");
  }

  const isVkExists = await contractExists(signer.provider!, vkRegistry);

  if (!isVkExists) {
    throw new Error("The VkRegistry contract does not exist");
  }

  // we need to ensure that the zkey files exist
  const isProcessMessagesZkeyPathExists = fs.existsSync(processMessagesZkeyPath);

  if (!isProcessMessagesZkeyPathExists) {
    throw new Error("The provided Process messages zkey does not exist");
  }

  const isTallyVotesZkeyPathExists = fs.existsSync(tallyVotesZkeyPath);

  if (!isTallyVotesZkeyPathExists) {
    throw new Error("The provided Tally votes zkey does not exist");
  }

  // extract the verification keys from the zkey files
  const { pollJoiningVk, pollJoinedVk, processVk, tallyVk } = await extractAllVks({
    processMessagesZkeyPath,
    tallyVotesZkeyPath,
    pollJoiningZkeyPath,
    pollJoinedZkeyPath,
  });

  const mode = useQuadraticVoting ? EMode.QV : EMode.NON_QV;

  const { pollJoiningVkOnChain, pollJoinedVkOnChain, processVkOnChain, tallyVkOnChain } = await getAllOnChainVks({
    vkRegistryAddress: vkRegistry,
    signer,
    stateTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    intStateTreeDepth,
    mode,
  });

  if (!compareVks(pollJoiningVkOnChain, pollJoiningVk)) {
    throw new Error("Poll verifying keys do not match");
  }

  if (!compareVks(pollJoinedVkOnChain, pollJoinedVk)) {
    throw new Error("Poll verifying keys do not match");
  }

  if (!compareVks(processVkOnChain, processVk)) {
    throw new Error("Process verifying keys do not match");
  }

  if (!compareVks(tallyVkOnChain, tallyVk)) {
    throw new Error("Tally verifying keys do not match");
  }

  return true;
};
