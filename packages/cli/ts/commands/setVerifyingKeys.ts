import { extractVk } from "maci-circuits";
import { type IVerifyingKeyStruct, EMode } from "maci-contracts";
import { VkRegistry__factory as VkRegistryFactory } from "maci-contracts/typechain-types";
import { genProcessVkSig, genTallyVkSig, MESSAGE_TREE_ARITY } from "maci-core";
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
  processMessagesZkeyPathQv,
  tallyVotesZkeyPathQv,
  processMessagesZkeyPathNonQv,
  tallyVotesZkeyPathNonQv,
  vkRegistry,
  signer,
  useQuadraticVoting = true,
  quiet = true,
}: SetVerifyingKeysArgs): Promise<void> => {
  banner(quiet);

  const network = await signer.provider?.getNetwork();

  // we must either have the contract as param or stored to file
  const vkRegistryAddress = vkRegistry || (await readContractAddress("VkRegistry", network?.name));

  if (!vkRegistryAddress) {
    logError("vkRegistry contract address is empty");
  }

  // check if zKey files exist
  const isProcessMessagesZkeyPathQvExists = processMessagesZkeyPathQv
    ? fs.existsSync(processMessagesZkeyPathQv)
    : false;

  if (useQuadraticVoting && processMessagesZkeyPathQv && !isProcessMessagesZkeyPathQvExists) {
    logError(`${processMessagesZkeyPathQv} does not exist.`);
  }

  const isTallyVotesZkeyPathQvExists = tallyVotesZkeyPathQv ? fs.existsSync(tallyVotesZkeyPathQv) : false;

  if (useQuadraticVoting && tallyVotesZkeyPathQv && !isTallyVotesZkeyPathQvExists) {
    logError(`${tallyVotesZkeyPathQv} does not exist.`);
  }

  const isProcessMessagesZkeyPathNonQvExists = processMessagesZkeyPathNonQv
    ? fs.existsSync(processMessagesZkeyPathNonQv)
    : false;

  if (!useQuadraticVoting && processMessagesZkeyPathNonQv && !isProcessMessagesZkeyPathNonQvExists) {
    logError(`${processMessagesZkeyPathNonQv} does not exist.`);
  }

  const isTallyVotesZkeyPathNonQvExists = tallyVotesZkeyPathNonQv ? fs.existsSync(tallyVotesZkeyPathNonQv) : false;

  if (!useQuadraticVoting && tallyVotesZkeyPathNonQv && !isTallyVotesZkeyPathNonQvExists) {
    logError(`${tallyVotesZkeyPathNonQv} does not exist.`);
  }

  // extract the vks
  const processVkQv = processMessagesZkeyPathQv && VerifyingKey.fromObj(await extractVk(processMessagesZkeyPathQv));
  const tallyVkQv = tallyVotesZkeyPathQv && VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPathQv));
  const processVkNonQv =
    processMessagesZkeyPathNonQv && VerifyingKey.fromObj(await extractVk(processMessagesZkeyPathNonQv));
  const tallyVkNonQv = tallyVotesZkeyPathNonQv && VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPathNonQv));

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

  checkZkeyFilepaths({
    processMessagesZkeyPath: processMessagesZkeyPathQv!,
    tallyVotesZkeyPath: tallyVotesZkeyPathQv!,
    stateTreeDepth,
    messageTreeDepth,
    messageBatchDepth,
    voteOptionTreeDepth,
    intStateTreeDepth,
  });

  checkZkeyFilepaths({
    processMessagesZkeyPath: processMessagesZkeyPathNonQv!,
    tallyVotesZkeyPath: tallyVotesZkeyPathNonQv!,
    stateTreeDepth,
    messageTreeDepth,
    messageBatchDepth,
    voteOptionTreeDepth,
    intStateTreeDepth,
  });

  // ensure we have a contract deployed at the provided address
  if (!(await contractExists(signer.provider!, vkRegistryAddress))) {
    logError(`A VkRegistry contract is not deployed at ${vkRegistryAddress}`);
  }

  // connect to VkRegistry contract
  const vkRegistryContract = VkRegistryFactory.connect(vkRegistryAddress, signer);

  const messageBatchSize = MESSAGE_TREE_ARITY ** messageBatchDepth;

  // check if the process messages vk was already set
  const processVkSig = genProcessVkSig(stateTreeDepth, messageTreeDepth, voteOptionTreeDepth, messageBatchSize);

  if (useQuadraticVoting && (await vkRegistryContract.isProcessVkSet(processVkSig, EMode.QV))) {
    logError("This process verifying key is already set in the contract");
  }

  if (!useQuadraticVoting && (await vkRegistryContract.isProcessVkSet(processVkSig, EMode.NON_QV))) {
    logError("This process verifying key is already set in the contract");
  }

  // do the same for the tally votes vk
  const tallyVkSig = genTallyVkSig(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth);

  if (useQuadraticVoting && (await vkRegistryContract.isTallyVkSet(tallyVkSig, EMode.QV))) {
    logError("This tally verifying key is already set in the contract");
  }

  if (!useQuadraticVoting && (await vkRegistryContract.isTallyVkSet(tallyVkSig, EMode.NON_QV))) {
    logError("This tally verifying key is already set in the contract");
  }

  // actually set those values
  try {
    logYellow(quiet, info("Setting verifying keys..."));

    const processZkeys = [processVkQv, processVkNonQv]
      .filter(Boolean)
      .map((vk) => (vk as VerifyingKey).asContractParam() as IVerifyingKeyStruct);
    const tallyZkeys = [tallyVkQv, tallyVkNonQv]
      .filter(Boolean)
      .map((vk) => (vk as VerifyingKey).asContractParam() as IVerifyingKeyStruct);
    const modes: EMode[] = [];

    if (processVkQv && tallyVkQv) {
      modes.push(EMode.QV);
    }

    if (processVkNonQv && tallyVkNonQv) {
      modes.push(EMode.NON_QV);
    }

    // set them onchain
    const tx = await vkRegistryContract.setVerifyingKeysBatch(
      stateTreeDepth,
      intStateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
      modes,
      processZkeys,
      tallyZkeys,
    );

    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Set verifying keys transaction failed");
    }

    logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));

    // confirm that they were actually set correctly
    if (useQuadraticVoting) {
      const processVkOnChain = await vkRegistryContract.getProcessVk(
        stateTreeDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
        messageBatchSize,
        EMode.QV,
      );

      const tallyVkOnChain = await vkRegistryContract.getTallyVk(
        stateTreeDepth,
        intStateTreeDepth,
        voteOptionTreeDepth,
        EMode.QV,
      );

      if (!compareVks(processVkQv as VerifyingKey, processVkOnChain)) {
        logError("processVk mismatch");
      }

      if (!compareVks(tallyVkQv as VerifyingKey, tallyVkOnChain)) {
        logError("tallyVk mismatch");
      }
    } else {
      const processVkOnChain = await vkRegistryContract.getProcessVk(
        stateTreeDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
        messageBatchSize,
        EMode.NON_QV,
      );

      const tallyVkOnChain = await vkRegistryContract.getTallyVk(
        stateTreeDepth,
        intStateTreeDepth,
        voteOptionTreeDepth,
        EMode.NON_QV,
      );

      if (!compareVks(processVkNonQv as VerifyingKey, processVkOnChain)) {
        logError("processVk mismatch");
      }

      if (!compareVks(tallyVkNonQv as VerifyingKey, tallyVkOnChain)) {
        logError("tallyVk mismatch");
      }
    }
  } catch (error) {
    logError((error as Error).message);
  }

  logGreen(quiet, success("Verifying keys set successfully"));
};

interface ICheckZkeyFilepathsArgs {
  stateTreeDepth: number;
  messageTreeDepth: number;
  messageBatchDepth: number;
  voteOptionTreeDepth: number;
  intStateTreeDepth: number;
  processMessagesZkeyPath?: string;
  tallyVotesZkeyPath?: string;
}

function checkZkeyFilepaths({
  processMessagesZkeyPath,
  tallyVotesZkeyPath,
  stateTreeDepth,
  messageTreeDepth,
  messageBatchDepth,
  voteOptionTreeDepth,
  intStateTreeDepth,
}: ICheckZkeyFilepathsArgs): void {
  if (!processMessagesZkeyPath || !tallyVotesZkeyPath) {
    return;
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
}
