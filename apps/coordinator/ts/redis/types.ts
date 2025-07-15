import { EMode } from "@maci-protocol/sdk";

import { ESupportedNetworks } from "../common";

/**
 * Interface for storing poll information in Redis
 */
export interface IStoredPollInfo {
  /**
   * maci contract address
   */
  maciAddress: string;

  /**
   * poll id (unique identifier)
   */
  pollId: string;

  /**
   * Voting mode
   */
  mode: EMode;

  /**
   * Deployment block number
   */
  deploymentBlockNumber?: number;

  /**
   * chain
   */
  chain: ESupportedNetworks;

  /**
   * end date
   */
  endDate: number;

  /**
   * has been merged
   */
  hasBeenMerged?: boolean;

  /**
   * has proofs been generated
   */
  hasProofsBeenGenerated?: boolean;
}
