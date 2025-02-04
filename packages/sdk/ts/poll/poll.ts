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
    maci: maciContract,
    tally: tallyContract,
  } = await getPollContracts({ maciAddress, pollId, signer, provider });

  const [[deployTime, duration], mergedStateRoot, pollAddress] = await Promise.all([
    pollContract.getDeployTimeAndDuration(),
    pollContract.mergedStateRoot(),
    pollContract.getAddress(),
  ]);
  const isMerged = mergedStateRoot !== BigInt(0);
  const numSignups = await (isMerged ? pollContract.numSignups() : maciContract.numSignUps());

  // get the poll mode
  const mode = await tallyContract.mode();

  return {
    id,
    address: pollAddress,
    deployTime,
    duration,
    numSignups,
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
  const numVoteOptions = 5 ** voteOptionTreeDepth;

  const messageBatchSize = Number.parseInt((await pollContract.messageBatchSize()).toString(), 10);

  const intStateTreeDepth = Number(treeDepths.intStateTreeDepth);
  const tallyBatchSize = 5 ** intStateTreeDepth;

  return {
    messageBatchSize,
    numVoteOptions,
    tallyBatchSize,
    voteOptionTreeDepth,
    intStateTreeDepth,
  };
};
