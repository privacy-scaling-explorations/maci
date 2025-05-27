import type { IGetPollArgs, IGetPollData, IGetPollParamsArgs, IPollParams } from "./types";

import { getPollContracts } from "./utils";

/**
 * Get deployed poll from MACI contract
 * @param {IGetPollArgs} args - The arguments for the get poll command
 * @returns {IGetPollData} poll data
 */
export const getPoll = async ({ maciAddress, signer, provider, pollId }: IGetPollArgs): Promise<IGetPollData> => {
  if (!signer && !provider) {
    throw new Error("No signer and provider are provided");
  }

  const {
    id,
    poll: pollContract,
    tally: tallyContract,
  } = await getPollContracts({ maciAddress, pollId, signer, provider });

  const [[startDate, endDate], mergedStateRoot, pollAddress] = await Promise.all([
    pollContract.getStartAndEndDate(),
    pollContract.mergedStateRoot(),
    pollContract.getAddress(),
  ]);
  const isMerged = mergedStateRoot !== BigInt(0);
  const totalSignups = await pollContract.totalSignups();

  // get the poll mode
  const mode = await tallyContract.mode();

  return {
    id,
    address: pollAddress,
    startDate,
    endDate,
    totalSignups,
    isMerged,
    mode,
  };
};

/**
 * Get the parameters for the poll
 * @param {IGetPollParamsArgs} args - The arguments for the get poll command
 * @returns {IPollParams} poll parameters
 */
export const getPollParams = async ({
  pollId,
  signer,
  maciContractAddress,
}: IGetPollParamsArgs): Promise<IPollParams> => {
  // get the contract objects
  const { poll: pollContract } = await getPollContracts({
    maciAddress: maciContractAddress,
    pollId,
    signer,
  });

  const treeDepths = await pollContract.treeDepths();
  const voteOptionTreeDepth = Number(treeDepths.voteOptionTreeDepth);
  const totalVoteOptions = 5 ** voteOptionTreeDepth;

  const messageBatchSize = Number.parseInt((await pollContract.messageBatchSize()).toString(), 10);

  const tallyProcessingStateTreeDepth = Number(treeDepths.tallyProcessingStateTreeDepth);
  const tallyBatchSize = 5 ** tallyProcessingStateTreeDepth;

  return {
    messageBatchSize,
    totalVoteOptions,
    tallyBatchSize,
    voteOptionTreeDepth,
    tallyProcessingStateTreeDepth,
  };
};
