import type { IGetPollKeyForRedisParams, IIdentityScheduledPoll } from "./types";

/**
 * Generates a Redis key for a poll based on its attributes
 *
 * @param chain - chain where the poll is deployed
 * @param maciAddress - maci contract where the poll was created
 * @param pollId - poll ID
 * @param test - Optional flag to indicate if this is a test environment
 * @returns key for Redis
 */
export const getPollKeyForRedis = ({ chain, maciAddress, pollId, test = false }: IGetPollKeyForRedisParams): string => {
  const isTest = test || process.env.NODE_ENV === "test";
  return `${chain}-${maciAddress}-poll-${pollId}${isTest ? `-test` : ""}`;
};

/**
 * Generates a Redis key for a poll object
 *
 * @param scheduledPoll - poll object to generate the key from
 * @param test - Optional flag to indicate if this is a test environment
 * @returns key for Redis
 */
export const getPollKeyFromObject = (scheduledPoll: IIdentityScheduledPoll, test?: boolean): string =>
  getPollKeyForRedis({
    chain: scheduledPoll.chain,
    maciAddress: scheduledPoll.maciAddress,
    pollId: scheduledPoll.pollId,
    test,
  });
