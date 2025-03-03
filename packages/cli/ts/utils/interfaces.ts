import type { Signer } from "ethers";
import type { EContracts, EGatekeepers } from "maci-sdk";

export interface DeployedContracts {
  maciAddress: string;
  pollFactoryAddress: string;
  poseidonT3Address: string;
  poseidonT4Address: string;
  poseidonT5Address: string;
  poseidonT6Address: string;
  initialVoiceCreditProxyAddress: string;
  signUpGatekeeperAddress: string;
  verifierAddress: string;
}

/**
 * Interface for the arguments to the deploy command
 */
export interface DeployArgs {
  /**
   * The depth of the state tree
   */
  stateTreeDepth: number;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * Gatekeeper contract name
   */
  signupGatekeeperContractName?: EGatekeepers;

  /**
   * The initial voice credits to be minted
   */
  initialVoiceCredits?: number;

  /**
   * The address of the initialVoiceCreditsProxy contract
   */
  initialVoiceCreditsProxyAddress?: string;

  /**
   * The address of the signupGatekeeper contract
   */
  signupGatekeeperAddress?: string;

  /**
   * The address of the PoseidonT3 contract
   */
  poseidonT3Address?: string;

  /**
   * The address of the PoseidonT4 contract
   */
  poseidonT4Address?: string;

  /**
   * The address of the PoseidonT5 contract
   */
  poseidonT5Address?: string;

  /**
   * The address of the PoseidonT6 contract
   */
  poseidonT6Address?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
}

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
