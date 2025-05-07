import type { BigNumberish, Signer } from "ethers";

/**
 * A circuit inputs for the circom circuit
 */
export type TCircuitInputs = Record<string, string | bigint | bigint[] | bigint[][] | string[] | bigint[][][]>;

/**
 * Circuit parameters
 */
export interface ICircuitParams {
  /**
   * The state tree depth
   */
  stateTreeDepth: number;
  /**
   * The intermediate state tree depth (ballot tree)
   */
  tallyProcessingStateTreeDepth: number;
  /**
   * The vote option tree depth
   */
  voteOptionTreeDepth: number;
  /**
   * The message batch size
   */
  messageBatchSize: number;
}

/**
 * Interface that represents Verification key
 */
export interface ISnarkJSVerificationKey {
  protocol: BigNumberish;
  curve: BigNumberish;
  nPublic: BigNumberish;
  vk_alpha_1: BigNumberish[];
  vk_beta_2: BigNumberish[][];
  vk_gamma_2: BigNumberish[][];
  vk_delta_2: BigNumberish[][];
  vk_alphabeta_12: BigNumberish[][][];
  IC: BigNumberish[][];
}

/**
 * Interface for the arguments to the TimeTravel command
 */
export interface ITimeTravelArgs {
  /**
   * The number of seconds to time travel
   */
  seconds: number;

  /**
   * A signer object
   */
  signer: Signer;
}

/**
 * Interface for the arguments to the FundWallet command
 */
export interface IFundWalletArgs {
  /**
   * The amount to fund
   */
  amount: number;

  /**
   * The address of the wallet to fund
   */
  address: string;

  /**
   * A signer object
   */
  signer: Signer;
}
