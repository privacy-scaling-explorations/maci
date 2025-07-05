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
  processMessagesVerifyingKeys,
  tallyVotesVerifyingKeys,
  stateTreeDepth,
  pollStateTreeDepth,
  tallyProcessingStateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
  verifyingKeysRegistryAddress,
  signer,
  modes,
}: ISetVerifyingKeysArgs): Promise<void> => {
  // validate args
  if (stateTreeDepth < 1 || tallyProcessingStateTreeDepth < 1 || voteOptionTreeDepth < 1 || messageBatchSize < 1) {
    throw new Error("Invalid depth or batch size parameters");
  }

  if (stateTreeDepth < tallyProcessingStateTreeDepth) {
    throw new Error("Invalid state tree depth or intermediate state tree depth");
  }

  if (processMessagesVerifyingKeys.length !== modes.length) {
    throw new Error("Number of process messages verifying keys must match number of modes");
  }

  if (tallyVotesVerifyingKeys.length !== modes.length) {
    throw new Error("Number of tally votes verifying keys must match number of modes");
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

  // check if the process messages verifyingKey was already set for each mode
  const processVerifyingKeySignature = generateProcessVerifyingKeySignature(
    stateTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
  );

  for (const mode of modes) {
    if (await verifyingKeysRegistryContract.isProcessVerifyingKeySet(processVerifyingKeySignature, mode)) {
      throw new Error(`This process verifying key is already set in the contract for mode ${mode}`);
    }
  }

  // do the same for the tally votes verifyingKey
  const tallyVerifyingKeySignature = generateTallyVerifyingKeySignature(
    stateTreeDepth,
    tallyProcessingStateTreeDepth,
    voteOptionTreeDepth,
  );

  for (const mode of modes) {
    if (await verifyingKeysRegistryContract.isTallyVerifyingKeySet(tallyVerifyingKeySignature, mode)) {
      throw new Error(`This tally verifying key is already set in the contract for mode ${mode}`);
    }
  }

  // set them onchain
  const tx = await verifyingKeysRegistryContract.setVerifyingKeysBatch({
    stateTreeDepth,
    pollStateTreeDepth,
    tallyProcessingStateTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    modes,
    pollJoiningVerifyingKey: pollJoiningVerifyingKey.asContractParam() as IVerifyingKeyStruct,
    pollJoinedVerifyingKey: pollJoinedVerifyingKey.asContractParam() as IVerifyingKeyStruct,
    processVerifyingKeys: processMessagesVerifyingKeys.map(key => key.asContractParam() as IVerifyingKeyStruct),
    tallyVerifyingKeys: tallyVotesVerifyingKeys.map(key => key.asContractParam() as IVerifyingKeyStruct),
  });

  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("Set verifying keys transaction failed");
  }

  // Verify that all keys were set correctly
  const pollJoiningVerifyingKeyOnChain = await verifyingKeysRegistryContract.getPollJoiningVerifyingKey(stateTreeDepth);
  const pollJoinedVerifyingKeyOnChain = await verifyingKeysRegistryContract.getPollJoinedVerifyingKey(stateTreeDepth);

  if (!compareVerifyingKeys(pollJoiningVerifyingKeyOnChain, pollJoiningVerifyingKey)) {
    throw new Error("pollJoiningVerifyingKey mismatch");
  }

  if (!compareVerifyingKeys(pollJoinedVerifyingKeyOnChain, pollJoinedVerifyingKey)) {
    throw new Error("pollJoinedVerifyingKey mismatch");
  }

  // Verify process and tally verifying keys for each mode
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const processVerifyingKeyOnChain = await verifyingKeysRegistryContract.getProcessVerifyingKey(
      stateTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
      mode,
    );
    const tallyVerifyingKeyOnChain = await verifyingKeysRegistryContract.getTallyVerifyingKey(
      stateTreeDepth,
      tallyProcessingStateTreeDepth,
      voteOptionTreeDepth,
      mode,
    );

    if (!compareVerifyingKeys(processVerifyingKeyOnChain, processMessagesVerifyingKeys[i])) {
      throw new Error(`processVerifyingKey mismatch for mode ${mode}`);
    }

    if (!compareVerifyingKeys(tallyVerifyingKeyOnChain, tallyVotesVerifyingKeys[i])) {
      throw new Error(`tallyVerifyingKey mismatch for mode ${mode}`);
    }
  }
};
