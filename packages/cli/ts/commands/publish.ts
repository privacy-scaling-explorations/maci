import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "maci-contracts/typechain-types";
import { PrivKey, PubKey } from "maci-domainobjs";
import { contractExists, generateVote, getCoordinatorPubKey, IVote, submitVote, submitVoteBatch } from "maci-sdk";

import type { IPublishBatchArgs, IPublishBatchData, PublishArgs } from "../utils/interfaces";

import { banner } from "../utils/banner";
import { info, logError, logGreen, logYellow } from "../utils/theme";

/**
 * Publish a new message to a MACI Poll contract
 * @param PublishArgs - The arguments for the publish command
 * @returns The ephemeral private key used to encrypt the message
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
  quiet = true,
}: PublishArgs): Promise<string> => {
  banner(quiet);

  // validate that the pub key of the user is valid
  if (!PubKey.isValidSerializedPubKey(pubkey)) {
    logError("Invalid MACI public key");
  }
  // deserialize
  const votePubKey = PubKey.deserialize(pubkey);

  if (!(await contractExists(signer.provider!, maciAddress))) {
    logError("MACI contract does not exist");
  }

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    logError("Invalid MACI private key");
  }

  const privKey = PrivKey.deserialize(privateKey);

  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollContracts = await maciContract.getPoll(pollId);

  if (!(await contractExists(signer.provider!, pollContracts.poll))) {
    logError("Poll contract does not exist");
  }

  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  const coordinatorPubKey = await getCoordinatorPubKey(pollContracts.poll, signer);
  const maxVoteOption = await pollContract.voteOptions();

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

  try {
    // submit the message onchain as well as the encryption public key
    const txHash = await submitVote({ pollAddress: await pollContract.getAddress(), vote, signer });

    logYellow(quiet, info(`Transaction hash: ${txHash}`));
    logGreen(quiet, info(`Ephemeral private key: ${vote.ephemeralKeypair.privKey.serialize()}`));
  } catch (error) {
    logError((error as Error).message);
  }

  // we want the user to have the ephemeral private key
  return vote.ephemeralKeypair.privKey.serialize();
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
  quiet = true,
}: IPublishBatchArgs): Promise<IPublishBatchData> => {
  banner(quiet);

  if (!PubKey.isValidSerializedPubKey(publicKey)) {
    throw new Error("Invalid MACI public key");
  }

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    throw new Error("Invalid MACI private key");
  }

  if (pollId < 0n) {
    throw new Error(`Invalid poll id ${pollId}`);
  }

  const userMaciPubKey = PubKey.deserialize(publicKey);
  const userMaciPrivKey = PrivKey.deserialize(privateKey);
  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollContracts = await maciContract.getPoll(pollId);

  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  const maxVoteOption = await pollContract.voteOptions().then(Number);
  const coordinatorPubKey = await getCoordinatorPubKey(pollContracts.poll, signer);

  const votes: IVote[] = [];

  // validate the vote options index against the max leaf index on-chain
  messages.forEach(({ stateIndex, voteOptionIndex, salt, nonce, newVoteWeight }) => {
    votes.push(
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
  });

  const txHash = await submitVoteBatch({
    pollAddress: await pollContract.getAddress(),
    votes: votes.reverse(),
    signer,
  });

  return {
    hash: txHash!,
    encryptedMessages: votes.map((vote) => vote.message),
    privateKeys: votes.map((vote) => vote.ephemeralKeypair.privKey.serialize()),
  };
};
