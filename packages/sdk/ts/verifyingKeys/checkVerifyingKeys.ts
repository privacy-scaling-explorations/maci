import { EMode } from "@maci-protocol/contracts";

import fs from "fs";

import type { ICheckVerifyingKeysArgs } from "./types";

import { contractExists } from "../utils";

import { compareVerifyingKeys, extractAllVerifyingKeys, getAllOnChainVerifyingKeys } from "./utils";

/**
 * Command to confirm that the verifying keys in the contract match the
 * local ones
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param CheckVerifyingKeysArgs - The arguments for the checkVerifyingKeys command
 * @returns Whether the verifying keys match or not
 */
export const checkVerifyingKeys = async ({
  stateTreeDepth,
  tallyProcessingStateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
  messageProcessorZkeyPath,
  voteTallyZkeyPath,
  pollJoiningZkeyPath,
  pollJoinedZkeyPath,
  verifyingKeysRegistry,
  signer,
  mode = EMode.QV,
}: ICheckVerifyingKeysArgs): Promise<boolean> => {
  if (!verifyingKeysRegistry) {
    throw new Error("Please provide a VerifyingKeysRegistry contract address");
  }

  const isVerifyingKeyExists = await contractExists(signer.provider!, verifyingKeysRegistry);

  if (!isVerifyingKeyExists) {
    throw new Error("The VerifyingKeysRegistry contract does not exist");
  }

  // we need to ensure that the zkey files exist
  const isProcessMessagesZkeyPathExists = fs.existsSync(messageProcessorZkeyPath);

  if (!isProcessMessagesZkeyPathExists) {
    throw new Error("The provided Process messages zkey does not exist");
  }

  const isTallyVotesZkeyPathExists = fs.existsSync(voteTallyZkeyPath);

  if (!isTallyVotesZkeyPathExists) {
    throw new Error("The provided Tally votes zkey does not exist");
  }

  // extract the verification keys from the zkey files
  const { pollJoiningVerifyingKey, pollJoinedVerifyingKey, processVerifyingKey, tallyVerifyingKey } =
    await extractAllVerifyingKeys({
      messageProcessorZkeyPath,
      voteTallyZkeyPath,
      pollJoiningZkeyPath,
      pollJoinedZkeyPath,
    });

  const {
    pollJoiningVerifyingKeyOnChain,
    pollJoinedVerifyingKeyOnChain,
    processVerifyingKeyOnChain,
    tallyVerifyingKeyOnChain,
  } = await getAllOnChainVerifyingKeys({
    verifyingKeysRegistryAddress: verifyingKeysRegistry,
    signer,
    stateTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    tallyProcessingStateTreeDepth,
    mode,
  });

  if (!compareVerifyingKeys(pollJoiningVerifyingKeyOnChain, pollJoiningVerifyingKey)) {
    throw new Error("Poll verifying keys do not match");
  }

  if (!compareVerifyingKeys(pollJoinedVerifyingKeyOnChain, pollJoinedVerifyingKey)) {
    throw new Error("Poll verifying keys do not match");
  }

  if (!compareVerifyingKeys(processVerifyingKeyOnChain, processVerifyingKey)) {
    throw new Error("Process verifying keys do not match");
  }

  if (!compareVerifyingKeys(tallyVerifyingKeyOnChain, tallyVerifyingKey)) {
    throw new Error("Tally verifying keys do not match");
  }

  return true;
};
