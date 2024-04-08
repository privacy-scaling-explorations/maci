import { extractVk } from "maci-circuits";
import { type IVerifyingKeyStruct, VkRegistry__factory as VkRegistryFactory, EMode } from "maci-contracts";
import { genProcessVkSig, genTallyVkSig } from "maci-core";
import { VerifyingKey } from "maci-domainobjs";

import fs from "fs";

import {
  type SetVerifyingKeysArgs,
  info,
  logError,
  logGreen,
  logYellow,
  success,
  readContractAddress,
  contractExists,
  banner,
  compareVks,
} from "../utils";

/**
 * Function that sets the verifying keys in the VkRegistry contract
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param SetVerifyingKeysArgs - The arguments for the setVerifyingKeys command
 */
export const setVerifyingKeys = async ({
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
}: SetVerifyingKeysArgs): Promise<void> => {
  banner(quiet);

  const network = await signer.provider?.getNetwork();

  // we must either have the contract as param or stored to file
  if (!readContractAddress("VkRegistry", network?.name) && !vkRegistry) {
    logError("vkRegistry contract address is empty");
  }

  const vkRegistryAddress = vkRegistry || readContractAddress("VkRegistry", network?.name);

  // check if zKey files exist
  if (!fs.existsSync(processMessagesZkeyPath)) {
    logError(`${processMessagesZkeyPath} does not exist.`);
  }

  if (!fs.existsSync(tallyVotesZkeyPath)) {
    logError(`${tallyVotesZkeyPath} does not exist.`);
  }

  // extract the vks
  const processVk = VerifyingKey.fromObj(await extractVk(processMessagesZkeyPath));
  const tallyVk = VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPath));

  // validate args
  if (
    stateTreeDepth < 1 ||
    intStateTreeDepth < 1 ||
    messageTreeDepth < 1 ||
    voteOptionTreeDepth < 1 ||
    messageBatchDepth < 1
  ) {
    logError("Invalid depth or batch size parameters");
  }

  if (stateTreeDepth < intStateTreeDepth) {
    logError("Invalid state tree depth or intermediate state tree depth");
  }

  // Check the pm zkey filename against specified params
  const pmMatch = processMessagesZkeyPath.match(/.+_(\d+)-(\d+)-(\d+)-(\d+)/);

  if (!pmMatch) {
    logError(`${processMessagesZkeyPath} has an invalid filename`);
    return;
  }

  const pmStateTreeDepth = Number(pmMatch[1]);
  const pmMsgTreeDepth = Number(pmMatch[2]);
  const pmMsgBatchDepth = Number(pmMatch[3]);
  const pmVoteOptionTreeDepth = Number(pmMatch[4]);

  const tvMatch = tallyVotesZkeyPath.match(/.+_(\d+)-(\d+)-(\d+)/);

  if (!tvMatch) {
    logError(`${tallyVotesZkeyPath} has an invalid filename`);
    return;
  }

  const tvStateTreeDepth = Number(tvMatch[1]);
  const tvIntStateTreeDepth = Number(tvMatch[2]);
  const tvVoteOptionTreeDepth = Number(tvMatch[3]);

  if (
    stateTreeDepth !== pmStateTreeDepth ||
    messageTreeDepth !== pmMsgTreeDepth ||
    messageBatchDepth !== pmMsgBatchDepth ||
    voteOptionTreeDepth !== pmVoteOptionTreeDepth ||
    stateTreeDepth !== tvStateTreeDepth ||
    intStateTreeDepth !== tvIntStateTreeDepth ||
    voteOptionTreeDepth !== tvVoteOptionTreeDepth
  ) {
    logError("Incorrect .zkey file; please check the circuit params");
  }

  // ensure we have a contract deployed at the provided address
  if (!(await contractExists(signer.provider!, vkRegistryAddress))) {
    logError(`A VkRegistry contract is not deployed at ${vkRegistryAddress}`);
  }

  // connect to VkRegistry contract
  const vkRegistryContract = VkRegistryFactory.connect(vkRegistryAddress, signer);

  const messageBatchSize = 5 ** messageBatchDepth;

  // check if the process messages vk was already set
  const mode = useQuadraticVoting ? EMode.QV : EMode.NON_QV;
  const processVkSig = genProcessVkSig(stateTreeDepth, messageTreeDepth, voteOptionTreeDepth, messageBatchSize);

  if (await vkRegistryContract.isProcessVkSet(processVkSig, mode)) {
    logError("This process verifying key is already set in the contract");
  }

  // do the same for the tally votes vk
  const tallyVkSig = genTallyVkSig(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth);

  if (await vkRegistryContract.isTallyVkSet(tallyVkSig, mode)) {
    logError("This tally verifying key is already set in the contract");
  }

  // actually set those values
  try {
    logYellow(quiet, info("Setting verifying keys..."));
    // set them onchain
    const tx = await vkRegistryContract.setVerifyingKeys(
      stateTreeDepth,
      intStateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
      mode,
      processVk.asContractParam() as IVerifyingKeyStruct,
      tallyVk.asContractParam() as IVerifyingKeyStruct,
    );

    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Set verifying keys transaction failed");
    }

    logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));

    // confirm that they were actually set correctly
    const processVkOnChain = await vkRegistryContract.getProcessVk(
      stateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
      mode,
    );

    const tallyVkOnChain = await vkRegistryContract.getTallyVk(
      stateTreeDepth,
      intStateTreeDepth,
      voteOptionTreeDepth,
      mode,
    );

    if (!compareVks(processVk, processVkOnChain)) {
      logError("processVk mismatch");
    }

    if (!compareVks(tallyVk, tallyVkOnChain)) {
      logError("tallyVk mismatch");
    }
  } catch (error) {
    logError((error as Error).message);
  }

  logGreen(quiet, success("Verifying keys set successfully"));
};
