import type { IIdentityScheduledPoll, IScheduledPoll } from "../redis/types";
import type { Hex } from "viem";

/**
 * Identity scheduled poll arguments with required arguments for signer
 */
export interface IIdentityPollWithSignerArgs extends IIdentityScheduledPoll {
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
 * Scheduled poll arguments with required arguments for signer
 */
export interface ISchedulePollWithSignerArgs extends IScheduledPoll {
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
export interface IGetPollFinalizationData {
  /**
   * End date of the poll
   */
  endDate: number;

  /**
   * Indicates if the poll has been merged
   */
  isPollMerged: boolean;

  /**
   * Indicates if the poll is tallied
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

/**
 * Setup poll finalization response
 */
export interface ISetupPollFinalizationResponse {
  /**
   * delay in milliseconds until poll finalization is executed
   */
  delay: number;
}
