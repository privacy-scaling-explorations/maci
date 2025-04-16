import { PrivateKey, PublicKey } from "@maci-protocol/domainobjs";

import type { IPublishBatchArgs, IPublishBatchData, IPublishArgs, IPublishData } from "./types";

import { getPollContracts } from "../poll";

import { generateVote } from "./generate";
import { submitVote, submitVoteBatch } from "./submit";
import { getCoordinatorPubKey } from "./utils";

/**
 * Publish a new message to a MACI Poll contract
 * @param {IPublishArgs} args - The arguments for the publish command
 * @returns {IPublishData} The ephemeral private key used to encrypt the message, transaction hash
 */
export const publish = async ({
  stateIndex,
  voteOptionIndex,
  nonce,
  pollId,
  newVoteWeight,
  maciAddress,
  salt,
  publicKey: serializedPublicKey,
  privateKey: serializedPrivateKey,
  signer,
}: IPublishArgs): Promise<IPublishData> => {
  if (!PublicKey.isValidSerializedPubKey(serializedPublicKey)) {
    throw new Error("Invalid MACI public key");
  }

  if (!PrivateKey.isValidSerializedPrivKey(serializedPrivateKey)) {
    throw new Error("Invalid MACI private key");
  }

  const { poll: pollContract } = await getPollContracts({ maciAddress, pollId, signer });

  const votePubKey = PublicKey.deserialize(serializedPublicKey);
  const privateKey = PrivateKey.deserialize(serializedPrivateKey);

  const [maxVoteOption, pollAddress] = await Promise.all([pollContract.voteOptions(), pollContract.getAddress()]);
  const coordinatorPublicKey = await getCoordinatorPubKey(pollAddress, signer);

  const vote = generateVote({
    pollId,
    voteOptionIndex,
    salt,
    nonce,
    privateKey,
    stateIndex,
    voteWeight: newVoteWeight,
    coordinatorPublicKey,
    maxVoteOption,
    newPublicKey: votePubKey,
  });

  const txHash = await submitVote({ pollAddress, vote, signer });

  return {
    hash: txHash!,
    encryptedMessage: vote.message,
    privateKey: vote.ephemeralKeypair.privateKey.serialize(),
  };
};

/**
 * Batch publish new messages to a MACI Poll contract
 * @param {IPublishBatchArgs} args - The arguments for the publish command
 * @returns {IPublishBatchData} The ephemeral private key used to encrypt the message, transaction hash
 */
export const publishBatch = async ({
  messages,
  pollId,
  maciAddress,
  publicKey,
  privateKey,
  signer,
}: IPublishBatchArgs): Promise<IPublishBatchData> => {
  if (!PublicKey.isValidSerializedPubKey(publicKey)) {
    throw new Error("Invalid MACI public key");
  }

  if (!PrivateKey.isValidSerializedPrivKey(privateKey)) {
    throw new Error("Invalid MACI private key");
  }

  const { poll: pollContract } = await getPollContracts({ maciAddress, pollId, signer });

  const userMaciPubKey = PublicKey.deserialize(publicKey);
  const userMaciPrivKey = PrivateKey.deserialize(privateKey);

  const [maxVoteOption, pollAddress] = await Promise.all([pollContract.voteOptions(), pollContract.getAddress()]);
  const coordinatorPublicKey = await getCoordinatorPubKey(pollAddress, signer);

  // validate the vote options index against the max leaf index on-chain
  const votes = messages.map(({ stateIndex, voteOptionIndex, salt, nonce, newVoteWeight }) =>
    generateVote({
      pollId,
      voteOptionIndex,
      nonce,
      privateKey: userMaciPrivKey,
      stateIndex,
      maxVoteOption: BigInt(maxVoteOption),
      salt,
      voteWeight: newVoteWeight,
      coordinatorPublicKey,
      newPublicKey: userMaciPubKey,
    }),
  );

  const txHash = await submitVoteBatch({
    pollAddress,
    votes: votes.reverse(),
    signer,
  });

  return {
    hash: txHash!,
    encryptedMessages: votes.map((vote) => vote.message),
    privateKeys: votes.map((vote) => vote.ephemeralKeypair.privateKey.serialize()),
  };
};
