import "./@types";

export { AccQueue } from "./AccQueue";

export { calcDepthFromNumLeaves, genTreeCommitment, genTreeProof } from "./utils";

export { bigInt2Buffer, stringifyBigInts, unstringifyBigInts, deepCopyBigIntArray } from "./bigIntUtils";

export { NOTHING_UP_MY_SLEEVE, SNARK_FIELD_SIZE } from "./constants";

export {
  G1Point,
  G2Point,
  sha256Hash,
  hashLeftRight,
  hashN,
  hash2,
  hash3,
  hash4,
  hash5,
  hash13,
  hashOne,
  genRandomBabyJubValue,
  genPrivKey,
  genRandomSalt,
  formatPrivKeyForBabyJub,
  genPubKey,
  genKeypair,
  genEcdhSharedKey,
  packPubKey,
  unpackPubKey,
} from "./crypto";

export { OptimisedMT as IncrementalQuinTree, type PathElements } from "optimisedmt";

export { poseidonDecrypt, poseidonEncrypt } from "@zk-kit/poseidon-cipher";

export { verifySignature, signMessage as sign } from "@zk-kit/eddsa-poseidon";

export type {
  PrivKey,
  PubKey,
  Point,
  EcdhSharedKey,
  Plaintext,
  Ciphertext,
  Queue,
  Keypair,
  Signature,
  PoseidonFuncs,
  Leaf,
} from "./types";
