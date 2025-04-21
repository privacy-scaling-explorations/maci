import type { PublicKey } from "./publicKey";
import type { G1Point, G2Point } from "@maci-protocol/crypto";

/**
 * @notice An interface representing a zk-SNARK proof
 */
export interface Proof {
  a: G1Point;
  b: G2Point;
  c: G1Point;
}

/**
 * @notice An interface representing a MACI state leaf
 */
export interface IStateLeaf {
  publicKey: PublicKey;
  voiceCreditBalance: bigint;
}

/**
 * @notice An interface representing a MACI vote option leaf
 */
export interface VoteOptionTreeLeaf {
  votes: bigint;
}

export interface IJsonKeyPair {
  privateKey: string;
  publicKey: string;
}

export type IJsonPrivateKey = Pick<IJsonKeyPair, "privateKey">;

export type IJsonPublicKey = Pick<IJsonKeyPair, "publicKey">;

export interface IJsonStateLeaf {
  publicKey: string;
  voiceCreditBalance: string;
}

export type BigNumberish = number | string | bigint;

export interface IG1ContractParams {
  x: BigNumberish;
  y: BigNumberish;
}

export interface IG2ContractParams {
  x: BigNumberish[];
  y: BigNumberish[];
}

export interface IVerifyingKeyContractParams {
  alpha1: IG1ContractParams;
  beta2: IG2ContractParams;
  gamma2: IG2ContractParams;
  delta2: IG2ContractParams;
  ic: IG1ContractParams[];
}

export interface IVerifyingKeyObjectParams {
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

export interface IStateLeafContractParams {
  publicKey: IG1ContractParams;
  voiceCreditBalance: BigNumberish;
}

export interface IMessageContractParams {
  data: BigNumberish[];
}

export interface IJsonBallot {
  votes: BigNumberish[];
  nonce: BigNumberish;
  voteOptionTreeDepth: BigNumberish;
}
