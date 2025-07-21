import type { ESupportedNetworks } from "../common";
import type { EMode } from "@maci-protocol/sdk";

/**
 * Interface for scheduled polls stored in Redis
 */
export interface IScheduledPoll {
  /**
   * Maci contract address
   */
  maciAddress: string;

  /**
   * Poll id (unique identifier)
   */
  pollId: string;

  /**
   * Voting mode
   */
  mode: EMode;

  /**
   * Chain in which the poll is deployed
   */
  chain: ESupportedNetworks;

  /**
   * End date
   */
  endDate: number;

  /**
   * Whether the MACI contract's state root has been merged
   */
  merged: boolean;

  /**
   * Whether the proofs has been generated
   */
  proofsGenerated: boolean;
}

/**
 * getPollKeyForRedis parameters
 */
export interface IGetPollKeyForRedisParams {
  /**
   * Chain in which the poll is deployed
   */
  chain: ESupportedNetworks;

  /**
   * Maci contract address
   */
  maciAddress: string;

  /**
   * Poll id (unique identifier)
   */
  pollId: string;

  /**
   * Test environment flag (optional)
   */
  test?: boolean;
}
