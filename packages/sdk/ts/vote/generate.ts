import { genRandomSalt } from "@maci-protocol/crypto";
import { Keypair, PCommand } from "@maci-protocol/domainobjs";

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
  coordinatorPubKey,
  maxVoteOption,
  ephemeralKeypair,
  newPubKey,
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

  const userSalt = salt ? BigInt(salt) : genRandomSalt();

  if (pollId < 0) {
    throw new Error("Invalid poll id");
  }

  // if no ephemeral keypair is provided, generate a new one
  const encKeypair = ephemeralKeypair ?? new Keypair();

  // create the command object
  const command = new PCommand(
    stateIndex,
    newPubKey ?? keypair.pubKey,
    voteOptionIndex,
    voteWeight,
    nonce,
    pollId,
    userSalt,
  );

  // sign the command with the poll private key
  const signature = command.sign(privateKey);

  // encrypt the command using a shared key between the user and the coordinator
  const message = command.encrypt(signature, Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorPubKey));

  return {
    message,
    ephemeralKeypair: encKeypair,
  };
};
