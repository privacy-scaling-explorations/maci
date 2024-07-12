import type { ESupportedNetworks } from "../common";

/**
 * Interface that represents deploy subgraph args
 */
export interface IDeploySubgraphArgs {
  /**
   * MACI contract address
   */
  maciContractAddress: string;

  /**
   * Start block
   */
  startBlock: number;

  /**
   * Network
   */
  network: ESupportedNetworks;

  /**
   * Subgraph name
   */
  name: string;

  /**
   * Version tag
   */
  tag: string;
}

/**
 * Interface that represents deploy subgraph return data
 */
export interface IDeploySubgraphReturn {
  /**
   * Deployed subgraph url
   */
  url: string;
}
