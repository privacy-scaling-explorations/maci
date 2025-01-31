import { ZeroAddress } from "ethers";
import {
  MACI__factory as MACIFactory,
  Poll__factory as PollFactory,
  Tally__factory as TallyFactory,
} from "maci-contracts/typechain-types";

import type { IGetPollArgs, IGetPollData, IGetPollParamsArgs, IPollParams } from "./types";

/**
 * Get deployed poll from MACI contract
 * @param {IGetPollArgs} args - The arguments for the get poll command
 * @returns {IGetPollData} poll data
 */
export const getPoll = async ({ maciAddress, signer, provider, pollId }: IGetPollArgs): Promise<IGetPollData> => {
  if (!signer && !provider) {
    throw new Error("No signer and provider are provided");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer ?? provider);
  const id =
    pollId === undefined ? await maciContract.nextPollId().then((nextPollId) => nextPollId - 1n) : BigInt(pollId);

  if (id < 0n) {
    throw new Error(`Invalid poll id ${id}`);
  }

  const pollContracts = await maciContract.polls(id);

  if (pollContracts.poll === ZeroAddress) {
    throw new Error(`MACI contract doesn't have any deployed poll ${id}`);
  }

  const pollContract = PollFactory.connect(pollContracts.poll, signer ?? provider);

  const [[deployTime, duration], mergedStateRoot] = await Promise.all([
    pollContract.getDeployTimeAndDuration(),
    pollContract.mergedStateRoot(),
  ]);
  const isMerged = mergedStateRoot !== BigInt(0);
  const numSignups = await (isMerged ? pollContract.numSignups() : maciContract.numSignUps());

  // get the poll mode
  const tallyContract = TallyFactory.connect(pollContracts.tally, signer ?? provider);
  const mode = await tallyContract.mode();

  return {
    id,
    address: pollContracts.poll,
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
  const maciContract = MACIFactory.connect(maciContractAddress, signer);
  const pollContracts = await maciContract.polls(pollId);
  const pollContract = PollFactory.connect(pollContracts.poll, signer);

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
