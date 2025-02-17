import { VerifyingKey } from "maci-domainobjs";
import { EMode, extractVk, setVerifyingKeys } from "maci-sdk";

import fs from "fs";

import { type SetVerifyingKeysArgs, logError, logGreen, success, readContractAddress, banner } from "../utils";

/**
 * Function that sets the verifying keys in the VkRegistry contract
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param SetVerifyingKeysArgs - The arguments for the setVerifyingKeys command
 */
export const setVerifyingKeysCli = async ({
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

  await setVerifyingKeys({
    pollJoiningVk: pollJoiningVk as VerifyingKey,
    pollJoinedVk: pollJoinedVk as VerifyingKey,
    processMessagesVk: useQuadraticVoting ? (processVkQv as VerifyingKey) : (processVkNonQv as VerifyingKey),
    tallyVotesVk: useQuadraticVoting ? (tallyVkQv as VerifyingKey) : (tallyVkNonQv as VerifyingKey),
    stateTreeDepth,
    intStateTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    vkRegistryAddress,
    signer,
    mode: useQuadraticVoting ? EMode.QV : EMode.NON_QV,
  });

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
