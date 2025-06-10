import type { IGetZkeyFilePathsData } from "../file/types";

/**
 * Interface for checking the rapidsnark setup
 */
export interface ICheckRapidsnark {
  /**
   * Rapidsnark executable path
   */
  rapidsnarkExecutablePath: string;

  /**
   * Is rapidsnark accessible
   */
  rapidsnarkIsAccessible: boolean;

  /**
   * Is rapidsnark executable
   */
  rapidsnarkIsExecutable: boolean;
}

/**
 * Interface for checking the zkeys directory
 */
export interface ICheckZkeysDirectory {
  /**
   * Does zkeys directory exist
   */
  zkeysDirectoryExists: boolean;

  /**
   * Available zkeys
   */
  availableZkeys: Record<string, IGetZkeyFilePathsData | undefined>;
}

/**
 * Interface for network info (balance and status)
 */
export interface INetworkInfo {
  /**
   * Network name
   */
  network: string;

  /**
   * Balance in the network
   */
  balance: string;

  /**
   * Is the network accessible
   */
  status: boolean;
}

/**
 * Interface for checking the coordinator wallet funds
 */
export interface ICheckWalletFunds {
  /**
   * Coordinator address
   */
  address: string;

  /**
   * Funds in all networks
   */
  fundsInNetworks: (INetworkInfo | undefined)[];
}

/**
 * Interface for the health check response
 */
export interface IHealthCheckResponse {
  /**
   * Rapidsnark check result
   */
  rapidsnark: ICheckRapidsnark;

  /**
   * Zkeys directory check result
   */
  zkeysDirectory: ICheckZkeysDirectory;

  /**
   * Coordinator wallet funds check result
   */
  coordinatorWalletFunds: ICheckWalletFunds;
}
