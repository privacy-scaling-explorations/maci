export type SnarkBigInt = bigint
export type PrivKey = bigint
export type PubKey = bigint[]
export type Point = bigint[]
export type EcdhSharedKey = bigint[]
export type Plaintext = bigint[]
export type Ciphertext = bigint[]

/**
 * A acc queue
 */
export interface Queue {
    levels: bigint[][];
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
export interface Signature {
    R8: bigint[];
    S: bigint;
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

export type Leaf = bigint
