import { Poll__factory as PollFactory } from "@maci-protocol/contracts/typechain-types";

import type { ISubmitVoteArgs, ISubmitVoteBatchArgs } from "./types";

/**
 * Submit a vote
 * @param args - The arguments for the vote
 */
export const submitVote = async ({ pollAddress, vote, signer }: ISubmitVoteArgs): Promise<string | undefined> => {
  const pollContract = PollFactory.connect(pollAddress, signer);

  const receipt = await pollContract
    .publishMessage(vote.message, vote.ephemeralKeypair.publicKey.asContractParam())
    .then((tx) => tx.wait());

  if (receipt?.status === 0) {
    throw new Error("Failed to submit the vote");
  }

  return receipt?.hash;
};

/**
 * Submit a batch of votes
 * @param args - The arguments for the vote
 * @dev Please ensure that the votes are in reverse order (by nonce) to be processed correctly
 */
export const submitVoteBatch = async ({
  pollAddress,
  votes,
  signer,
}: ISubmitVoteBatchArgs): Promise<string | undefined> => {
  const pollContract = PollFactory.connect(pollAddress, signer);

  const receipt = await pollContract
    .publishMessageBatch(
      votes.map((vote) => vote.message),
      votes.map((vote) => vote.ephemeralKeypair.publicKey.asContractParam()),
    )
    .then((tx) => tx.wait());

  if (receipt?.status === 0) {
    throw new Error("Failed to submit the batch of votes");
  }

  return receipt?.hash;
};
