import type { EContracts } from "@maci-protocol/sdk";
import type { Signer } from "ethers";

/**
 * Interface that represents store contract arguments
 */
export interface IStoreContractsArgs {
  /**
   * Contract params object
   */
  data: Partial<Record<EContracts, { address: string; args: unknown[]; key?: string }>>;

  /**
   * Ethereum signer
   */
  signer: Signer;
}

/**
 * Interface that represents read contract addresses arguments
 */
export interface IReadContractAddressesArgs {
  /**
   * Contract names
   */
  contractNames: EContracts[];

  /**
   * Network name
   */
  network?: string;

  /**
   * Storage keys
   */
  keys?: string[];

  /**
   * Default addresses
   */
  defaultAddresses?: (string | undefined)[];
}
