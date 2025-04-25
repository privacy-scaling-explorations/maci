import {
  MACI__factory as MACIFactory,
  Tally__factory as TallyFactory,
  Poll__factory as PollFactory,
} from "@maci-protocol/contracts/typechain-types";

import type { IGetResultPerOptionArgs, IGetResultsArgs } from "./types";

/**
 * Get result per option
 * @param {IGetResultPerOptionsArgs} - The arguments to get result per option
 * @returns The result per option
 */
export const getResultPerOption = async ({
  maciAddress,
  pollId,
  index,
  signer,
}: IGetResultPerOptionArgs): Promise<bigint> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  const pollContracts = await maciContract.getPoll(pollId);

  const tallyContract = TallyFactory.connect(pollContracts.tally, signer);

  const result = await tallyContract.tallyResults(index);

  if (!result.flag) {
    throw new Error("Tally result is not set");
  }

  return result.value;
};

/**
 * Get all results from the Tally contract
 * @param {IGetResultsArgs} - The arguments to get all the results
 * @returns The results array (The final result of vote option n is in index n-1)
 */
export const getResults = async ({ maciAddress, pollId, signer }: IGetResultsArgs): Promise<bigint[]> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  const pollContracts = await maciContract.getPoll(pollId);

  const pollContract = PollFactory.connect(pollContracts.poll, signer);
  const numberOfVoteOptions = await pollContract.voteOptions();

  const tallyContract = TallyFactory.connect(pollContracts.tally, signer);

  const results: bigint[] = [];

  for (let i = 0; i < numberOfVoteOptions; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const result = await tallyContract.tallyResults(i);

    if (!result.flag) {
      throw new Error(`Tally result for option ${i} is not set`);
    }

    results.push(result.value);
  }

  return results;
};
