import { Signer } from "ethers";
import { Poll__factory as PollFactory } from "maci-contracts";
import { genRandomSalt } from "maci-crypto";
import { Keypair, PCommand, PubKey } from "maci-domainobjs";

import type { IGenerateVoteArgs, IVote } from "./types";

import { validateSalt } from "./utils";

/**
 * Get the coordinator public key for a poll
 * @param pollAddress - the address of the poll
 * @param signer - the signer to use
 * @returns the coordinator public key
 */
export const getCoordinatorPubKey = async (pollAddress: string, signer: Signer): Promise<PubKey> => {
  const pollContract = PollFactory.connect(pollAddress, signer);

  const coordinatorPubKey = await pollContract.coordinatorPubKey();

  return new PubKey([coordinatorPubKey.x, coordinatorPubKey.y]);
};

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
    throw new Error("invalid vote option index");
  }

  // check < 1 cause index zero is a blank state leaf
  if (stateIndex < 1) {
    throw new Error("invalid state index");
  }

  if (nonce < 0) {
    throw new Error("invalid nonce");
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
  const command: PCommand = new PCommand(
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
