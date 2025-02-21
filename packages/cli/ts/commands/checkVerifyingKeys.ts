import { extractAllVks, compareVks, getAllOnChainVks, EMode } from "maci-sdk";

import fs from "fs";

import {
  CheckVerifyingKeysArgs,
  banner,
  contractExists,
  info,
  logError,
  logGreen,
  logYellow,
  readContractAddress,
  success,
} from "../utils";

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
  quiet = true,
}: CheckVerifyingKeysArgs): Promise<boolean> => {
  banner(quiet);
  const network = await signer.provider?.getNetwork();

  // ensure we have the contract addresses that we need
  const vkContractAddress = vkRegistry || (await readContractAddress("VkRegistry", network?.name));

  if (!vkContractAddress) {
    logError("Please provide a VkRegistry contract address");
  }

  const isVkExists = await contractExists(signer.provider!, vkContractAddress);

  if (!isVkExists) {
    logError("The VkRegistry contract does not exist");
  }

  // we need to ensure that the zkey files exist
  const isProcessMessagesZkeyPathExists = fs.existsSync(processMessagesZkeyPath);

  if (!isProcessMessagesZkeyPathExists) {
    logError("The provided Process messages zkey does not exist");
  }

  const isTallyVotesZkeyPathExists = fs.existsSync(tallyVotesZkeyPath);

  if (!isTallyVotesZkeyPathExists) {
    logError("The provided Tally votes zkey does not exist");
  }

  // extract the verification keys from the zkey files
  const { pollJoiningVk, pollJoinedVk, processVk, tallyVk } = await extractAllVks({
    processMessagesZkeyPath,
    tallyVotesZkeyPath,
    pollJoiningZkeyPath,
    pollJoinedZkeyPath,
  });

  try {
    logYellow(quiet, info("Retrieving verifying keys from the contract..."));
    // retrieve the verifying keys from the contract

    const mode = useQuadraticVoting ? EMode.QV : EMode.NON_QV;

    const { pollJoiningVkOnChain, pollJoinedVkOnChain, processVkOnChain, tallyVkOnChain } = await getAllOnChainVks({
      vkRegistryAddress: vkContractAddress,
      signer,
      stateTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
      intStateTreeDepth,
      mode,
    });

    // do the actual validation
    if (!compareVks(pollJoiningVkOnChain, pollJoiningVk)) {
      logError("Poll verifying keys do not match");
    }

    if (!compareVks(pollJoinedVkOnChain, pollJoinedVk)) {
      logError("Poll verifying keys do not match");
    }

    if (!compareVks(processVkOnChain, processVk)) {
      logError("Process verifying keys do not match");
    }

    if (!compareVks(tallyVkOnChain, tallyVk)) {
      logError("Tally verifying keys do not match");
    }
  } catch (error) {
    logError((error as Error).message);
  }

  logGreen(quiet, success("Verifying keys match"));

  return true;
};
