import type { Signer } from "ethers";

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

export interface PollContracts {
  poll: string;
  messageProcessor: string;
  tally: string;
  signupGatekeeper: string;
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
