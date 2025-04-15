import {
  MACI__factory as MACIFactory,
  MessageProcessor__factory as MessageProcessorFactory,
  Poll__factory as PollFactory,
  Tally__factory as TallyFactory,
} from "@maci-protocol/contracts/typechain-types";
import { ZeroAddress } from "ethers";

import type { IGetPollArgs, IGetPollContractsData } from "./types";

import { contractExists } from "../utils/contracts";

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

  const isMaciExists = await contractExists(signer?.provider || provider!, maciAddress);

  if (!isMaciExists) {
    throw new Error("MACI contract does not exist");
  }

  const pollContracts = await maci.polls(id);

  if (pollContracts.poll === ZeroAddress) {
    throw new Error(`MACI contract doesn't have any deployed poll ${id}`);
  }

  const isPollExists = await contractExists(signer?.provider || provider!, pollContracts.poll);

  if (!isPollExists) {
    throw new Error("Poll contract does not exist");
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
