import { extractVerifyingKey } from "@maci-protocol/contracts";
import { VerifyingKeysRegistry__factory as VerifyingKeysRegistryFactory } from "@maci-protocol/contracts/typechain-types";
import { type IVerifyingKeyContractParams, VerifyingKey } from "@maci-protocol/domainobjs";

import fs from "fs";

import type {
  IGetAllVerifyingKeysArgs,
  IExtractAllVerifyingKeysArgs,
  IMaciVerifyingKeys,
  IMaciVerifyingKeysOnchain,
  IExtractVerifyingKeyToFileArgs,
} from "./types";

/**
 * Get all the verifying keys from the contract
 * @param args - The arguments for the getAllVerifyingKeys function
 * @returns The verifying keys
 */
export const getAllOnChainVerifyingKeys = async ({
  verifyingKeysRegistryAddress,
  signer,
  stateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
  tallyProcessingStateTreeDepth,
  mode,
}: IGetAllVerifyingKeysArgs): Promise<IMaciVerifyingKeysOnchain> => {
  const contract = VerifyingKeysRegistryFactory.connect(verifyingKeysRegistryAddress, signer);

  const [
    pollJoiningVerifyingKeyOnChain,
    pollJoinedVerifyingKeyOnChain,
    processVerifyingKeyOnChain,
    tallyVerifyingKeyOnChain,
  ] = await Promise.all([
    contract.getPollJoiningVerifyingKey(stateTreeDepth),
    contract.getPollJoinedVerifyingKey(stateTreeDepth),
    contract.getProcessVerifyingKey(stateTreeDepth, voteOptionTreeDepth, messageBatchSize, mode),
    contract.getTallyVerifyingKey(stateTreeDepth, tallyProcessingStateTreeDepth, voteOptionTreeDepth, mode),
  ]);

  return {
    pollJoiningVerifyingKeyOnChain,
    pollJoinedVerifyingKeyOnChain,
    processVerifyingKeyOnChain,
    tallyVerifyingKeyOnChain,
  };
};

/**
 * Compare two verifying keys
 * @param verifyingKeyOnChain - the verifying key on chain
 * @param verifyingKey - the local verifying key
 * @returns whether they are equal or not
 */
export const compareVerifyingKeys = (
  verifyingKeyOnChain: VerifyingKey | IVerifyingKeyContractParams,
  verifyingKey?: VerifyingKey | IVerifyingKeyContractParams,
): boolean => {
  if (!verifyingKey) {
    throw new Error("Verifying key is not provided");
  }

  let isEqual = verifyingKey.ic.length === verifyingKeyOnChain.ic.length;
  for (let i = 0; i < verifyingKey.ic.length; i += 1) {
    isEqual = isEqual && verifyingKey.ic[i].x.toString() === verifyingKeyOnChain.ic[i].x.toString();
    isEqual = isEqual && verifyingKey.ic[i].y.toString() === verifyingKeyOnChain.ic[i].y.toString();
  }

  isEqual = isEqual && verifyingKey.alpha1.x.toString() === verifyingKeyOnChain.alpha1.x.toString();
  isEqual = isEqual && verifyingKey.alpha1.y.toString() === verifyingKeyOnChain.alpha1.y.toString();
  isEqual = isEqual && verifyingKey.beta2.x[0].toString() === verifyingKeyOnChain.beta2.x[0].toString();
  isEqual = isEqual && verifyingKey.beta2.x[1].toString() === verifyingKeyOnChain.beta2.x[1].toString();
  isEqual = isEqual && verifyingKey.beta2.y[0].toString() === verifyingKeyOnChain.beta2.y[0].toString();
  isEqual = isEqual && verifyingKey.beta2.y[1].toString() === verifyingKeyOnChain.beta2.y[1].toString();
  isEqual = isEqual && verifyingKey.delta2.x[0].toString() === verifyingKeyOnChain.delta2.x[0].toString();
  isEqual = isEqual && verifyingKey.delta2.x[1].toString() === verifyingKeyOnChain.delta2.x[1].toString();
  isEqual = isEqual && verifyingKey.delta2.y[0].toString() === verifyingKeyOnChain.delta2.y[0].toString();
  isEqual = isEqual && verifyingKey.delta2.y[1].toString() === verifyingKeyOnChain.delta2.y[1].toString();
  isEqual = isEqual && verifyingKey.gamma2.x[0].toString() === verifyingKeyOnChain.gamma2.x[0].toString();
  isEqual = isEqual && verifyingKey.gamma2.x[1].toString() === verifyingKeyOnChain.gamma2.x[1].toString();
  isEqual = isEqual && verifyingKey.gamma2.y[0].toString() === verifyingKeyOnChain.gamma2.y[0].toString();
  isEqual = isEqual && verifyingKey.gamma2.y[1].toString() === verifyingKeyOnChain.gamma2.y[1].toString();

  return isEqual;
};

/**
 * Extract all the verifying keys
 * @param args - The arguments for the extractAllVerifyingKeys function
 * @returns The verifying keys
 */
export const extractAllVerifyingKeys = async ({
  pollJoiningZkeyPath,
  pollJoinedZkeyPath,
  messageProcessorZkeyPath,
  voteTallyZkeyPath,
}: IExtractAllVerifyingKeysArgs): Promise<IMaciVerifyingKeys> => {
  // extract the verifying keys
  const pollJoiningVerifyingKey = pollJoiningZkeyPath
    ? VerifyingKey.fromObj(await extractVerifyingKey(pollJoiningZkeyPath))
    : undefined;
  const pollJoinedVerifyingKey = pollJoinedZkeyPath
    ? VerifyingKey.fromObj(await extractVerifyingKey(pollJoinedZkeyPath))
    : undefined;

  const processVerifyingKey = messageProcessorZkeyPath
    ? VerifyingKey.fromObj(await extractVerifyingKey(messageProcessorZkeyPath))
    : undefined;
  const tallyVerifyingKey = voteTallyZkeyPath
    ? VerifyingKey.fromObj(await extractVerifyingKey(voteTallyZkeyPath))
    : undefined;

  return {
    pollJoiningVerifyingKey,
    pollJoinedVerifyingKey,
    processVerifyingKey,
    tallyVerifyingKey,
  };
};

/**
 * Command to confirm that the verifying keys in the contract match the local ones
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param args The arguments for the checkVerifyingKeys command
 * @returns Whether the verifying keys match or not
 */
export const extractVerifyingKeyToFile = async ({
  messageProcessorZkeyPathQv,
  voteTallyZkeyPathQv,
  messageProcessorZkeyPathNonQv,
  messageProcessorZkeyPathFull,
  pollJoinedZkeyPath,
  pollJoiningZkeyPath,
  voteTallyZkeyPathNonQv,
  outputFilePath,
}: IExtractVerifyingKeyToFileArgs): Promise<void> => {
  const [
    processVerifyingKeyQv,
    tallyVerifyingKeyQv,
    processVerifyingKeyNonQv,
    tallyVerifyingKeyNonQv,
    pollJoiningVerifyingKey,
    pollJoinedVerifyingKey,
    processVerifyingKeyFull,
  ] = await Promise.all([
    extractVerifyingKey(messageProcessorZkeyPathQv),
    extractVerifyingKey(voteTallyZkeyPathQv),
    extractVerifyingKey(messageProcessorZkeyPathNonQv),
    extractVerifyingKey(voteTallyZkeyPathNonQv),
    extractVerifyingKey(pollJoiningZkeyPath),
    extractVerifyingKey(pollJoinedZkeyPath),
    extractVerifyingKey(messageProcessorZkeyPathFull),
  ]);

  await fs.promises.writeFile(
    outputFilePath,
    JSON.stringify({
      processVerifyingKeyQv,
      tallyVerifyingKeyQv,
      processVerifyingKeyNonQv,
      tallyVerifyingKeyNonQv,
      pollJoiningVerifyingKey,
      pollJoinedVerifyingKey,
      processVerifyingKeyFull,
    }),
  );
};
