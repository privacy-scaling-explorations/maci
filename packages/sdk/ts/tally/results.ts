import type { IGetResultPerOptionArgs, IGetResultsArgs, IResult } from "./types";

import { getPollContracts } from "../poll";

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
}: IGetResultPerOptionArgs): Promise<IResult> => {
  const { tally } = await getPollContracts({ maciAddress, pollId, signer });

  const { value, isSet } = await tally.getTallyResults(index);

  return {
    value,
    isSet,
  };
};

/**
 * Get all results from the Tally contract
 * @param {IGetResultsArgs} - The arguments to get all the results
 * @returns The results array (The final result of vote option n is in index n-1)
 */
export const getResults = async ({ maciAddress, pollId, signer }: IGetResultsArgs): Promise<IResult[]> => {
  const { poll, tally } = await getPollContracts({ maciAddress, pollId, signer });

  const numberOfVoteOptions = await poll.voteOptions();

  const results: IResult[] = [];

  for (let i = 0; i < numberOfVoteOptions; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const { value, isSet } = await tally.getTallyResults(i);

    results.push({
      value,
      isSet,
    });
  }

  return results;
};

/**
 * Check if the poll is tallied
 * @param {IGetResultsArgs} - The arguments to check if the poll is tallied
 * @returns {boolean} - True if the poll is tallied, false otherwise
 */
export const isTallied = async ({ maciAddress, pollId, signer }: IGetResultsArgs): Promise<boolean> => {
  const { tally } = await getPollContracts({ maciAddress, pollId, signer });

  return tally.isTallied();
};
