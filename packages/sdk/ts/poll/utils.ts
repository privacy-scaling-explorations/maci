import { ZeroAddress } from "ethers";
import {
  MACI__factory as MACIFactory,
  MessageProcessor__factory as MessageProcessorFactory,
  Poll__factory as PollFactory,
  Tally__factory as TallyFactory,
} from "maci-contracts/typechain-types";

import type { IGetPollArgs, IGetPollContractsData } from "./types";

/**
 * Get poll contracts
 *
 * @param args get poll contract args
 * @returns poll contracts
 */
export const getPollContracts = async ({
  maciAddress,
  pollId,
  signer,
  provider,
}: IGetPollArgs): Promise<IGetPollContractsData> => {
  const maci = MACIFactory.connect(maciAddress, signer ?? provider);
  const id = pollId === undefined ? await maci.nextPollId().then((nextPollId) => nextPollId - 1n) : BigInt(pollId);

  if (id < 0n) {
    throw new Error(`Invalid poll id ${id}`);
  }

  const pollContracts = await maci.polls(id);

  if (pollContracts.poll === ZeroAddress) {
    throw new Error(`MACI contract doesn't have any deployed poll ${id}`);
  }

  const poll = PollFactory.connect(pollContracts.poll, signer ?? provider);
  const messageProcessor = MessageProcessorFactory.connect(pollContracts.messageProcessor, signer ?? provider);
  const tally = TallyFactory.connect(pollContracts.tally, signer ?? provider);

  return {
    id,
    maci,
    poll,
    messageProcessor,
    tally,
  };
};
