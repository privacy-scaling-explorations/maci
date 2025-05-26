import { Keypair } from "@maci-protocol/domainobjs";

import type { IInvalidateVotesArgs } from "./types";

import { getPollContracts } from "../poll";

import { generateVote } from "./generate";
import { submitVote } from "./submit";
import { getCoordinatorPublicKey } from "./utils";

/**
 * Invalidate votes
 * @dev This function is used to invalidate votes for a given poll
 *      by sending a key change command with a new random key
 *      Given messages are processed in reverse order, this will be processed before
 *      previous votes and would require previous votes to have been casted with this
 *      new key, which is impossible.
 * @param args invalidate votes args
 * @returns transaction hash
 */
export const invalidateVotes = async ({
  maciAddress,
  pollId,
  signer,
  maciPrivateKey,
  stateIndex,
}: IInvalidateVotesArgs): Promise<string | undefined> => {
  const { poll: pollContract } = await getPollContracts({ maciAddress, pollId, signer });

  const [maxVoteOption, pollAddress] = await Promise.all([pollContract.voteOptions(), pollContract.getAddress()]);
  const coordinatorPublicKey = await getCoordinatorPublicKey(pollAddress, signer);

  // generate the key change message
  const message = generateVote({
    pollId,
    voteOptionIndex: 0n,
    nonce: 1n,
    privateKey: maciPrivateKey,
    stateIndex,
    // use a random key to invalidate the previous votes
    newPublicKey: new Keypair().publicKey,
    voteWeight: 0n,
    coordinatorPublicKey,
    maxVoteOption,
  });

  const receipt = await submitVote({
    pollAddress,
    vote: message,
    signer,
  });

  return receipt;
};
