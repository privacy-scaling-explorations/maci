import { type IVerifyingKeyStruct, VkRegistry__factory as VkRegistryFactory, EMode } from "maci-contracts";
import { genPollJoinedVkSig, genPollJoiningVkSig, genProcessVkSig, genTallyVkSig } from "maci-core";
import { VerifyingKey } from "maci-domainobjs";
import { extractVk } from "maci-sdk";

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
  voteOptionTreeDepth,
  messageBatchSize,
  pollJoiningZkeyPath,
  pollJoinedZkeyPath,
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
  if (pollJoiningZkeyPath && !fs.existsSync(pollJoiningZkeyPath)) {
    logError(`${pollJoiningZkeyPath} does not exist.`);
  }

  const isProcessMessagesZkeyPathQvExists = processMessagesZkeyPathQv
    ? fs.existsSync(processMessagesZkeyPathQv)
    : false;

  if (useQuadraticVoting && !isProcessMessagesZkeyPathQvExists) {
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
  const pollJoiningVk = pollJoiningZkeyPath && VerifyingKey.fromObj(await extractVk(pollJoiningZkeyPath));
  const pollJoinedVk = pollJoinedZkeyPath && VerifyingKey.fromObj(await extractVk(pollJoinedZkeyPath));
  const processVkQv = processMessagesZkeyPathQv && VerifyingKey.fromObj(await extractVk(processMessagesZkeyPathQv));
  const tallyVkQv = tallyVotesZkeyPathQv && VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPathQv));
  const processVkNonQv =
    processMessagesZkeyPathNonQv && VerifyingKey.fromObj(await extractVk(processMessagesZkeyPathNonQv));
  const tallyVkNonQv = tallyVotesZkeyPathNonQv && VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPathNonQv));

  // validate args
  if (stateTreeDepth < 1 || intStateTreeDepth < 1 || voteOptionTreeDepth < 1 || messageBatchSize < 1) {
    logError("Invalid depth or batch size parameters");
  }

  if (stateTreeDepth < intStateTreeDepth) {
    logError("Invalid state tree depth or intermediate state tree depth");
  }

  checkZkeyFilepaths({
    pollJoiningZkeyPath: pollJoiningZkeyPath!,
    pollJoinedZkeyPath: pollJoinedZkeyPath!,
    processMessagesZkeyPath: processMessagesZkeyPathQv!,
    tallyVotesZkeyPath: tallyVotesZkeyPathQv!,
    stateTreeDepth,
    messageBatchSize,
    voteOptionTreeDepth,
    intStateTreeDepth,
  });

  // ensure we have a contract deployed at the provided address
  if (!(await contractExists(signer.provider!, vkRegistryAddress))) {
    logError(`A VkRegistry contract is not deployed at ${vkRegistryAddress}`);
  }

  // connect to VkRegistry contract
  const vkRegistryContract = VkRegistryFactory.connect(vkRegistryAddress, signer);

  // check if the poll vk was already set
  const pollJoiningVkSig = genPollJoiningVkSig(stateTreeDepth, voteOptionTreeDepth);

  if (await vkRegistryContract.isPollJoiningVkSet(pollJoiningVkSig)) {
    logError("This poll verifying key is already set in the contract");
  }

  // check if the poll vk was already set
  const pollJoinedVkSig = genPollJoinedVkSig(stateTreeDepth, voteOptionTreeDepth);

  if (await vkRegistryContract.isPollJoinedVkSet(pollJoinedVkSig)) {
    logError("This poll verifying key is already set in the contract");
  }

  // check if the process messages vk was already set
  const processVkSig = genProcessVkSig(stateTreeDepth, voteOptionTreeDepth, messageBatchSize);

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
      voteOptionTreeDepth,
      messageBatchSize,
      modes,
      (pollJoiningVk as VerifyingKey).asContractParam() as IVerifyingKeyStruct,
      (pollJoinedVk as VerifyingKey).asContractParam() as IVerifyingKeyStruct,
      processZkeys,
      tallyZkeys,
    );

    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Set verifying keys transaction failed");
    }

    logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));

    // confirm that they were actually set correctly
    const mode = useQuadraticVoting ? EMode.QV : EMode.NON_QV;

    const [pollJoiningVkOnChain, pollJoinedVkOnChain, processVkOnChain, tallyVkOnChain] = await Promise.all([
      vkRegistryContract.getPollJoiningVk(stateTreeDepth, voteOptionTreeDepth),
      vkRegistryContract.getPollJoinedVk(stateTreeDepth, voteOptionTreeDepth),
      vkRegistryContract.getProcessVk(stateTreeDepth, voteOptionTreeDepth, messageBatchSize, mode),
      vkRegistryContract.getTallyVk(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth, mode),
    ]);

    if (!compareVks(pollJoiningVk as VerifyingKey, pollJoiningVkOnChain)) {
      logError("pollJoiningVk mismatch");
    }

    if (!compareVks(pollJoinedVk as VerifyingKey, pollJoinedVkOnChain)) {
      logError("pollJoinedVk mismatch");
    }

    if (!compareVks((useQuadraticVoting ? processVkQv : processVkNonQv) as VerifyingKey, processVkOnChain)) {
      logError("processVk mismatch");
    }

    if (!compareVks((useQuadraticVoting ? tallyVkQv : tallyVkNonQv) as VerifyingKey, tallyVkOnChain)) {
      logError("tallyVk mismatch");
    }
  } catch (error) {
    logError((error as Error).message);
  }

  logGreen(quiet, success("Verifying keys set successfully"));
};

interface ICheckZkeyFilepathsArgs {
  stateTreeDepth: number;
  messageBatchSize: number;
  voteOptionTreeDepth: number;
  intStateTreeDepth: number;
  pollJoiningZkeyPath?: string;
  pollJoinedZkeyPath?: string;
  processMessagesZkeyPath?: string;
  tallyVotesZkeyPath?: string;
}

function checkZkeyFilepaths({
  pollJoiningZkeyPath,
  pollJoinedZkeyPath,
  processMessagesZkeyPath,
  tallyVotesZkeyPath,
  stateTreeDepth,
  messageBatchSize,
  voteOptionTreeDepth,
  intStateTreeDepth,
}: ICheckZkeyFilepathsArgs): void {
  if (!pollJoiningZkeyPath || !processMessagesZkeyPath || !tallyVotesZkeyPath || !pollJoinedZkeyPath) {
    return;
  }

  // Check the pm zkey filename against specified params
  const pollJoiningMatch = pollJoiningZkeyPath.match(/.+_(\d+)/);

  if (!pollJoiningMatch) {
    logError(`${pollJoiningZkeyPath} has an invalid filename`);
    return;
  }

  const pollJoinedMatch = pollJoinedZkeyPath.match(/.+_(\d+)/);

  if (!pollJoinedMatch) {
    logError(`${pollJoinedZkeyPath} has an invalid filename`);
    return;
  }

  const pollJoiningStateTreeDepth = Number(pollJoiningMatch[1]);
  const pollJoinedStateTreeDepth = Number(pollJoinedMatch[1]);

  const pmMatch = processMessagesZkeyPath.match(/.+_(\d+)-(\d+)-(\d+)/);

  if (!pmMatch) {
    logError(`${processMessagesZkeyPath} has an invalid filename`);
    return;
  }

  const pmStateTreeDepth = Number(pmMatch[1]);
  const pmMsgBatchSize = Number(pmMatch[2]);
  const pmVoteOptionTreeDepth = Number(pmMatch[3]);

  const tvMatch = tallyVotesZkeyPath.match(/.+_(\d+)-(\d+)-(\d+)/);

  if (!tvMatch) {
    logError(`${tallyVotesZkeyPath} has an invalid filename`);
    return;
  }

  const tvStateTreeDepth = Number(tvMatch[1]);
  const tvIntStateTreeDepth = Number(tvMatch[2]);
  const tvVoteOptionTreeDepth = Number(tvMatch[3]);

  if (
    stateTreeDepth !== pollJoiningStateTreeDepth ||
    stateTreeDepth !== pollJoinedStateTreeDepth ||
    stateTreeDepth !== pmStateTreeDepth ||
    messageBatchSize !== pmMsgBatchSize ||
    voteOptionTreeDepth !== pmVoteOptionTreeDepth ||
    stateTreeDepth !== tvStateTreeDepth ||
    intStateTreeDepth !== tvIntStateTreeDepth ||
    voteOptionTreeDepth !== tvVoteOptionTreeDepth
  ) {
    logError("Incorrect .zkey file; please check the circuit params");
  }
}
