// we define a bignumber as either a bigint or a string
// which is what we use the most in MACI
export type SnarkBigNumber = bigint | string;

// a private key is a single BigNumber
export type PrivKey = SnarkBigNumber;

// a public key is a pair of BigNumbers
export type PubKey<N = bigint> = [N, N];

// a shared key is a pair of BigNumbers
export type EcdhSharedKey<N = bigint> = [N, N];

// a point is a pair of BigNumbers
export type Point<N = SnarkBigNumber> = [N, N];

// a plaintext is an array of BigNumbers
export type Plaintext<N = bigint> = N[];

// a ciphertext is an array of BigNumbers
export type Ciphertext<N = bigint> = N[];

// a merkle tree path elements
export type PathElements = bigint[][];

/**
 * A acc queue
 */
export interface Queue {
  levels: Map<number, Map<number, bigint>>;
  indices: number[];
}

/**
 * A private key and a public key
 */
export interface Keypair {
  privKey: PrivKey;
  pubKey: PubKey;
}

// An EdDSA signature.
// R8 is a Baby Jubjub elliptic curve point and S is an element of the finite
// field of order `l` where `l` is the large prime number dividing the order of
// Baby Jubjub: see
// https://iden3-docs.readthedocs.io/en/latest/_downloads/a04267077fb3fdbf2b608e014706e004/Ed-DSA.pdf
export interface Signature<N = SnarkBigNumber> {
  R8: Point<N>;
  S: N;
}

/**
 * A interface for poseidon hash functions
 */
export interface PoseidonFuncs {
  [key: number]: (inputs: bigint[]) => bigint;
  2: (inputs: bigint[]) => bigint;
  3: (inputs: bigint[]) => bigint;
  4: (inputs: bigint[]) => bigint;
  5: (inputs: bigint[]) => bigint;
}

// a leaf is a single BigNumber
export type Leaf = bigint;

// a node is a leaf or subroot in a quinary merkle tree
export type Node = Record<number, Leaf>;

// a merkle proof is a set of path elements, path indices, and a root
export interface IMerkleProof {
  pathElements: Leaf[][];
  pathIndices: number[];
  root: Leaf;
  leaf: Leaf;
}

export type StringifiedBigInts =
  | StringifiedBigInts[]
  | string
  | string[]
  | string[][]
  | string[][][]
  | { [key: string]: StringifiedBigInts }
  | null;

export type BigIntVariants =
  | BigIntVariants[]
  | StringifiedBigInts
  | bigint
  | bigint[]
  | bigint[][]
  | bigint[][][]
  | { [key: string]: BigIntVariants }
  | Uint8Array
  | null;
