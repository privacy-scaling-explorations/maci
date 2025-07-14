import { EMode } from "@maci-protocol/sdk";
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
export interface IRegisterPollArgs extends IPollScheduledArgs {
  /**
   * Voting mode
   */
  mode?: EMode;

  /**
   * Approval for the session key
   */
  approval?: string;

  /**
   * Session key address
   */
  sessionKeyAddress?: Hex;
}

/**
 * poll end date and is tallied response
 */
export interface IRegisterPollResponse {
  /**
   * End date of the poll
   */
  endDate: number;

  /**
   * Indicates if the poll is tallied
   *
   */
  isPollTallied: boolean;
}

/**
 * Is poll scheduled response
 */
export interface IIsPollScheduledResponse {
  /**
   * Indicates if the poll is scheduled
   *
   */
  isScheduled: boolean;
}
