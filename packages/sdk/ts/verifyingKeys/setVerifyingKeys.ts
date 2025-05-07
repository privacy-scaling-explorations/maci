import { type IVerifyingKeyStruct } from "@maci-protocol/contracts";
import { VerifyingKeysRegistry__factory as VerifyingKeysRegistryFactory } from "@maci-protocol/contracts/typechain-types";
import {
  generatePollJoinedVerifyingKeySignature,
  generatePollJoiningVerifyingKeySignature,
  generateProcessVerifyingKeySignature,
  generateTallyVerifyingKeySignature,
} from "@maci-protocol/core";

import type { ISetVerifyingKeysArgs } from "./types";

import { contractExists } from "../utils";

import { compareVerifyingKeys } from "./utils";

/**
 * Set the verifying keys on the contract
 * @param args - The arguments for the setVerifyingKeys function
 */
export const setVerifyingKeys = async ({
  pollJoiningVerifyingKey,
  pollJoinedVerifyingKey,
  processMessagesVerifyingKey,
  tallyVotesVerifyingKey,
  stateTreeDepth,
  pollStateTreeDepth,
  tallyProcessingStateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
  verifyingKeysRegistryAddress,
  signer,
  mode,
}: ISetVerifyingKeysArgs): Promise<void> => {
  // validate args
  if (stateTreeDepth < 1 || tallyProcessingStateTreeDepth < 1 || voteOptionTreeDepth < 1 || messageBatchSize < 1) {
    throw new Error("Invalid depth or batch size parameters");
  }

  if (stateTreeDepth < tallyProcessingStateTreeDepth) {
    throw new Error("Invalid state tree depth or intermediate state tree depth");
  }

  const isContractExists = await contractExists(signer.provider!, verifyingKeysRegistryAddress);
  // ensure we have a contract deployed at the provided address
  if (!isContractExists) {
    throw new Error(`A VerifyingKeysRegistry contract is not deployed at ${verifyingKeysRegistryAddress}`);
  }

  // connect to VerifyingKeysRegistry contract
  const verifyingKeysRegistryContract = VerifyingKeysRegistryFactory.connect(verifyingKeysRegistryAddress, signer);

  // check if the poll verifyingKey was already set
  const pollJoiningVerifyingKeySignature = generatePollJoiningVerifyingKeySignature(stateTreeDepth);

  if (await verifyingKeysRegistryContract.isPollJoiningVerifyingKeySet(pollJoiningVerifyingKeySignature)) {
    throw new Error("This poll verifying key is already set in the contract");
  }

  // check if the poll verifyingKey was already set
  const pollJoinedVerifyingKeySignature = generatePollJoinedVerifyingKeySignature(stateTreeDepth);

  if (await verifyingKeysRegistryContract.isPollJoinedVerifyingKeySet(pollJoinedVerifyingKeySignature)) {
    throw new Error("This poll verifying key is already set in the contract");
  }

  // check if the process messages verifyingKey was already set
  const processVerifyingKeySignature = generateProcessVerifyingKeySignature(
    stateTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
  );

  if (await verifyingKeysRegistryContract.isProcessVerifyingKeySet(processVerifyingKeySignature, mode)) {
    throw new Error("This process verifying key is already set in the contract");
  }

  // do the same for the tally votes verifyingKey
  const tallyVerifyingKeySignature = generateTallyVerifyingKeySignature(
    stateTreeDepth,
    tallyProcessingStateTreeDepth,
    voteOptionTreeDepth,
  );

  if (await verifyingKeysRegistryContract.isTallyVerifyingKeySet(tallyVerifyingKeySignature, mode)) {
    throw new Error("This tally verifying key is already set in the contract");
  }

  // set them onchain
  const tx = await verifyingKeysRegistryContract.setVerifyingKeysBatch({
    stateTreeDepth,
    pollStateTreeDepth,
    tallyProcessingStateTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    modes: [mode],
    pollJoiningVerifyingKey: pollJoiningVerifyingKey.asContractParam() as IVerifyingKeyStruct,
    pollJoinedVerifyingKey: pollJoinedVerifyingKey.asContractParam() as IVerifyingKeyStruct,
    processVerifyingKeys: [processMessagesVerifyingKey.asContractParam() as IVerifyingKeyStruct],
    tallyVerifyingKeys: [tallyVotesVerifyingKey.asContractParam() as IVerifyingKeyStruct],
  });

  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("Set verifying keys transaction failed");
  }

  const [
    pollJoiningVerifyingKeyOnChain,
    pollJoinedVerifyingKeyOnChain,
    processVerifyingKeyOnChain,
    tallyVerifyingKeyOnChain,
  ] = await Promise.all([
    verifyingKeysRegistryContract.getPollJoiningVerifyingKey(stateTreeDepth),
    verifyingKeysRegistryContract.getPollJoinedVerifyingKey(stateTreeDepth),
    verifyingKeysRegistryContract.getProcessVerifyingKey(stateTreeDepth, voteOptionTreeDepth, messageBatchSize, mode),
    verifyingKeysRegistryContract.getTallyVerifyingKey(
      stateTreeDepth,
      tallyProcessingStateTreeDepth,
      voteOptionTreeDepth,
      mode,
    ),
  ]);

  if (!compareVerifyingKeys(pollJoiningVerifyingKeyOnChain, pollJoiningVerifyingKey)) {
    throw new Error("pollJoiningVerifyingKey mismatch");
  }

  if (!compareVerifyingKeys(pollJoinedVerifyingKeyOnChain, pollJoinedVerifyingKey)) {
    throw new Error("pollJoinedVerifyingKey mismatch");
  }

  if (!compareVerifyingKeys(processVerifyingKeyOnChain, processMessagesVerifyingKey)) {
    throw new Error("processVerifyingKey mismatch");
  }

  if (!compareVerifyingKeys(tallyVerifyingKeyOnChain, tallyVotesVerifyingKey)) {
    throw new Error("tallyVerifyingKey mismatch");
  }
};
