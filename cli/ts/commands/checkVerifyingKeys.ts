import { extractVk } from "maci-circuits";
import { EMode, VkRegistry__factory as VkRegistryFactory } from "maci-contracts";
import { VerifyingKey } from "maci-domainobjs";

import fs from "fs";

import {
  CheckVerifyingKeysArgs,
  banner,
  compareVks,
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
  messageTreeDepth,
  voteOptionTreeDepth,
  messageBatchDepth,
  processMessagesZkeyPath,
  tallyVotesZkeyPath,
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

  if (!(await contractExists(signer.provider!, vkContractAddress))) {
    logError("The VkRegistry contract does not exist");
  }

  const vkRegistryContractInstance = VkRegistryFactory.connect(vkContractAddress, signer);

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
  const processVk = VerifyingKey.fromObj(await extractVk(processMessagesZkeyPath));
  const tallyVk = VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPath));

  try {
    logYellow(quiet, info("Retrieving verifying keys from the contract..."));
    // retrieve the verifying keys from the contract
    const messageBatchSize = 5 ** messageBatchDepth;

    const processVkOnChain = await vkRegistryContractInstance.getProcessVk(
      stateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
      useQuadraticVoting ? EMode.QV : EMode.NON_QV,
    );

    const tallyVkOnChain = await vkRegistryContractInstance.getTallyVk(
      stateTreeDepth,
      intStateTreeDepth,
      voteOptionTreeDepth,
      useQuadraticVoting ? EMode.QV : EMode.NON_QV,
    );

    // do the actual validation
    if (!compareVks(processVk, processVkOnChain)) {
      logError("Process verifying keys do not match");
    }

    if (!compareVks(tallyVk, tallyVkOnChain)) {
      logError("Tally verifying keys do not match");
    }
  } catch (error) {
    logError((error as Error).message);
  }

  logGreen(quiet, success("Verifying keys match"));

  return true;
};
