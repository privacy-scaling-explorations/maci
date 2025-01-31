import type { BigNumberish } from "ethers";

/**
 * A circuit inputs for the circom circuit
 */
export type CircuitInputs = Record<string, string | bigint | bigint[] | bigint[][] | string[] | bigint[][][]>;

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
  intStateTreeDepth: number;
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
