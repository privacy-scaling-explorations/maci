import type { PubKey } from "./publicKey";
import type { G1Point, G2Point } from "maci-crypto";

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
  pubKey: PubKey;
  voiceCreditBalance: bigint;
}

/**
 * @notice An interface representing a MACI vote option leaf
 */
export interface VoteOptionTreeLeaf {
  votes: bigint;
}

export interface IJsonKeyPair {
  privKey: string;
  pubKey: string;
}

export type IJsonPrivateKey = Pick<IJsonKeyPair, "privKey">;

export type IJsonPublicKey = Pick<IJsonKeyPair, "pubKey">;

export interface IJsonStateLeaf {
  pubKey: string;
  voiceCreditBalance: string;
  timestamp: string;
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

export interface IVkContractParams {
  alpha1: IG1ContractParams;
  beta2: IG2ContractParams;
  gamma2: IG2ContractParams;
  delta2: IG2ContractParams;
  ic: IG1ContractParams[];
}

export interface IVkObjectParams {
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
  pubKey: IG1ContractParams;
  voiceCreditBalance: BigNumberish;
  timestamp: BigNumberish;
}

export interface IMessageContractParams {
  msgType: string;
  data: BigNumberish[];
}

export interface IJsonBallot {
  votes: BigNumberish[];
  nonce: BigNumberish;
  voteOptionTreeDepth: BigNumberish;
}
