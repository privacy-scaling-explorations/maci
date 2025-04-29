import { generateRandomSalt } from "@maci-protocol/crypto";
import { Keypair, VoteCommand } from "@maci-protocol/domainobjs";

import type { IGenerateVoteArgs, IVote } from "./types";

import { validateSalt } from "./utils";

/**
 * Generate a vote
 * @param args - The arguments for the vote
 * @returns The vote object
 */
export const generateVote = ({
  pollId,
  voteOptionIndex,
  salt,
  nonce,
  privateKey,
  stateIndex,
  voteWeight,
  coordinatorPublicKey,
  maxVoteOption,
  ephemeralKeypair,
  newPublicKey,
}: IGenerateVoteArgs): IVote => {
  const keypair = new Keypair(privateKey);

  // validate args
  if (voteOptionIndex < 0 || voteOptionIndex > maxVoteOption) {
    throw new Error("Invalid vote option index");
  }

  // check < 1 cause index zero is a blank state leaf
  if (stateIndex < 1) {
    throw new Error("Invalid state index");
  }

  if (nonce < 0) {
    throw new Error("Invalid nonce");
  }

  if (salt && !validateSalt(salt)) {
    throw new Error("Invalid salt");
  }

  const userSalt = salt ? BigInt(salt) : generateRandomSalt();

  if (pollId < 0) {
    throw new Error("Invalid poll id");
  }

  // if no ephemeral keypair is provided, generate a new one
  const encKeypair = ephemeralKeypair ?? new Keypair();

  // create the command object
  const command = new VoteCommand(
    stateIndex,
    newPublicKey ?? keypair.publicKey,
    voteOptionIndex,
    voteWeight,
    nonce,
    pollId,
    userSalt,
  );

  // sign the command with the poll private key
  const signature = command.sign(privateKey);

  // encrypt the command using a shared key between the user and the coordinator
  const message = command.encrypt(
    signature,
    Keypair.generateEcdhSharedKey(encKeypair.privateKey, coordinatorPublicKey),
  );

  return {
    message,
    ephemeralKeypair: encKeypair,
  };
};
