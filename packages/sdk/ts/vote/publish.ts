import { PrivKey, PubKey } from "@maci-protocol/domainobjs";

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
  pubkey,
  stateIndex,
  voteOptionIndex,
  nonce,
  pollId,
  newVoteWeight,
  maciAddress,
  salt,
  privateKey,
  signer,
}: IPublishArgs): Promise<IPublishData> => {
  if (!PubKey.isValidSerializedPubKey(pubkey)) {
    throw new Error("Invalid MACI public key");
  }

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    throw new Error("Invalid MACI private key");
  }

  const { poll: pollContract } = await getPollContracts({ maciAddress, pollId, signer });

  const votePubKey = PubKey.deserialize(pubkey);
  const privKey = PrivKey.deserialize(privateKey);

  const [maxVoteOption, pollAddress] = await Promise.all([pollContract.voteOptions(), pollContract.getAddress()]);
  const coordinatorPubKey = await getCoordinatorPubKey(pollAddress, signer);

  const vote = generateVote({
    pollId,
    voteOptionIndex,
    salt,
    nonce,
    privateKey: privKey,
    stateIndex,
    voteWeight: newVoteWeight,
    coordinatorPubKey,
    maxVoteOption,
    newPubKey: votePubKey,
  });

  const txHash = await submitVote({ pollAddress, vote, signer });

  return {
    hash: txHash!,
    encryptedMessage: vote.message,
    privateKey: vote.ephemeralKeypair.privKey.serialize(),
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
  if (!PubKey.isValidSerializedPubKey(publicKey)) {
    throw new Error("Invalid MACI public key");
  }

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    throw new Error("Invalid MACI private key");
  }

  const { poll: pollContract } = await getPollContracts({ maciAddress, pollId, signer });

  const userMaciPubKey = PubKey.deserialize(publicKey);
  const userMaciPrivKey = PrivKey.deserialize(privateKey);

  const [maxVoteOption, pollAddress] = await Promise.all([pollContract.voteOptions(), pollContract.getAddress()]);
  const coordinatorPubKey = await getCoordinatorPubKey(pollAddress, signer);

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
      coordinatorPubKey,
      newPubKey: userMaciPubKey,
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
    privateKeys: votes.map((vote) => vote.ephemeralKeypair.privKey.serialize()),
  };
};
