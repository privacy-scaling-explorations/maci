import { G1Point, G2Point } from "maci-crypto";
import { PubKey } from "./publicKey";

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
