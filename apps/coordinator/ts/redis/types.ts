import { ESupportedNetworks } from "../common";

/**
 * Interface for storing poll information in Redis
 */
export interface IStoredPollInfo {
  /**
   * maci contract address
   */
  maciContractAddress: string;

  /**
   * poll id (unique identifier)
   */
  pollId: string;

  /**
   * chain
   */
  chain: ESupportedNetworks;

  /**
   * end date
   */
  endDate: number;

  /**
   * boolean indicating if the poll has been finalized
   */
  isTallied: boolean;
}
