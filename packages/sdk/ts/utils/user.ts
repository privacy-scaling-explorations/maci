import { BLOCKS_STEP } from "./constants";
import { IParsePollJoinEventsArgs, IParseSignupEventsArgs } from "./interfaces";

/**
 * Parse the poll joining events from the Poll contract
 */
export const parsePollJoinEvents = async ({
  pollContract,
  startBlock,
  currentBlock,
  pollPublicKey,
}: IParsePollJoinEventsArgs): Promise<{
  pollStateIndex?: string;
  voiceCredits?: string;
}> => {
  // 1000 blocks at a time
  for (let block = startBlock; block <= currentBlock; block += BLOCKS_STEP) {
    const toBlock = Math.min(block + BLOCKS_STEP - 1, currentBlock);
    const pubKey = pollPublicKey.asArray();
    // eslint-disable-next-line no-await-in-loop
    const newEvents = await pollContract.queryFilter(
      pollContract.filters.PollJoined(pubKey[0], pubKey[1], undefined, undefined, undefined, undefined),
      block,
      toBlock,
    );

    if (newEvents.length > 0) {
      const [event] = newEvents;

      return {
        pollStateIndex: event.args[5].toString(),
        voiceCredits: event.args[2].toString(),
      };
    }
  }

  return {
    pollStateIndex: undefined,
    voiceCredits: undefined,
  };
};

/**
 * Parse the signup events from the MACI contract
 */
export const parseSignupEvents = async ({
  maciContract,
  startBlock,
  currentBlock,
  publicKey,
}: IParseSignupEventsArgs): Promise<{ stateIndex?: string }> => {
  // 1000 blocks at a time
  for (let block = startBlock; block <= currentBlock; block += BLOCKS_STEP) {
    const toBlock = Math.min(block + BLOCKS_STEP - 1, currentBlock);
    // eslint-disable-next-line no-await-in-loop
    const newEvents = await maciContract.queryFilter(
      maciContract.filters.SignUp(undefined, undefined, publicKey.rawPubKey[0], publicKey.rawPubKey[1]),
      block,
      toBlock,
    );

    if (newEvents.length > 0) {
      const [event] = newEvents;

      return {
        stateIndex: event.args[0].toString(),
      };
    }
  }

  return {
    stateIndex: undefined,
  };
};
