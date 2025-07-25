import type { ESupportedNetworks } from "../common";
import type { EMode } from "@maci-protocol/sdk";

/**
 * Interface of the minimal properties to identify a scheduled poll
 */
export interface IIdentityScheduledPoll {
  /**
   * Maci contract address
   */
  maciAddress: string;

  /**
   * Poll id (unique identifier)
   */
  pollId: string;

  /**
   * Chain in which the poll is deployed
   */
  chain: ESupportedNetworks;
}

/**
 * Interface for scheduled polls stored in Redis
 */
export interface IScheduledPoll extends IIdentityScheduledPoll {
  /**
   * Deployment block number
   */
  deploymentBlockNumber: number;

  /**
   * Voting mode
   */
  mode: EMode;

  /**
   * End date in seconds
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
export interface IGetPollKeyForRedisParams extends IIdentityScheduledPoll {
  /**
   * Test environment flag (optional)
   */
  test?: boolean;
}
