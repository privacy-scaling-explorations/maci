import { Hex } from "viem";

import { ESupportedNetworks } from "../common";

/**
 * Arguments for scheduling poll finalization
 */
export interface IPollScheduledArgs {
  /**
   * MACI contract address
   */
  maciAddress: string;

  /**
   * Poll ID
   */
  pollId: number;

  /**
   * Chain
   */
  chain: ESupportedNetworks;
}

/**
 * Schedule poll finalization arguments
 */
export interface ISchedulePollFinalizationArgs extends IPollScheduledArgs {
  /**
   * Approval for the session key
   */
  approval?: string;

  /**
   * Session key address
   */
  sessionKeyAddress?: Hex;
}
