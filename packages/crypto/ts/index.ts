export { calcDepthFromNumLeaves, genTreeCommitment, genTreeProof } from "./utils";

export { IncrementalQuinTree } from "./quinTree";

export { bigInt2Buffer, stringifyBigInts, unstringifyBigInts, deepCopyBigIntArray } from "./bigIntUtils";

export { NOTHING_UP_MY_SLEEVE, SNARK_FIELD_SIZE, PAD_KEY_HASH } from "./constants";

export {
  genPrivKey,
  genRandomSalt,
  formatPrivKeyForBabyJub,
  genPubKey,
  genKeypair,
  genEcdhSharedKey,
  packPubKey,
  unpackPubKey,
} from "./keys";

export { G1Point, G2Point, genRandomBabyJubValue } from "./babyjub";

export {
  sha256Hash,
  hashLeftRight,
  hashN,
  hash2,
  hash3,
  hash4,
  hash5,
  hash12,
  hashOne,
  poseidon,
  hashLeanIMT,
} from "./hashing";

export { inCurve } from "@zk-kit/baby-jubjub";

export { poseidonDecrypt, poseidonDecryptWithoutCheck, poseidonEncrypt } from "@zk-kit/poseidon-cipher";

export { verifySignature, signMessage as sign } from "@zk-kit/eddsa-poseidon";

export type {
  PrivateKey,
  PublicKey,
  Point,
  EcdhSharedKey,
  Plaintext,
  Ciphertext,
  Queue,
  Keypair,
  Signature,
  PoseidonFuncs,
  Leaf,
  PathElements,
} from "./types";
