import type { IGetPollKeyForRedisParams, IScheduledPoll } from "./types";

/**
 * Generates a Redis key for a poll based on its attributes
 *
 * @param chain - chain where the poll is deployed
 * @param maciAddress - maci contract where the poll was created
 * @param pollId - poll ID
 * @param test - Optional flag to indicate if this is a test environment
 * @returns key for Redis
 */
export const getPollKeyForRedis = ({ chain, maciAddress, pollId, test = false }: IGetPollKeyForRedisParams): string =>
  `${chain}-${maciAddress}-poll-${pollId}${test ? `-test` : ""}`;

/**
 * Generates a Redis key for a poll object
 *
 * @param scheduledPoll - poll object to generate the key from
 * @param test - Optional flag to indicate if this is a test environment
 * @returns key for Redis
 */
export const getPollKeyFromObject = (scheduledPoll: IScheduledPoll, test?: boolean): string =>
  getPollKeyForRedis({
    chain: scheduledPoll.chain,
    maciAddress: scheduledPoll.maciAddress,
    pollId: scheduledPoll.pollId,
    test,
  });
