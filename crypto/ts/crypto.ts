import { mulPointEscalar, Point } from "@zk-kit/baby-jubjub";
import { deriveSecretScalar, derivePublicKey, packPublicKey, unpackPublicKey } from "@zk-kit/eddsa-poseidon";
import { poseidonPerm } from "@zk-kit/poseidon-cipher";
import { utils } from "ethers";

import assert from "assert";
import { randomBytes } from "crypto";

import type { EcdhSharedKey, PrivKey, PubKey, PoseidonFuncs, Keypair } from "./types";

import { SNARK_FIELD_SIZE } from "./constants";

/**
 * @notice A class representing a point on the first group (G1)
 * of the Jubjub curve
 */
export class G1Point {
  x: bigint;

  y: bigint;

  constructor(x: bigint, y: bigint) {
    assert(x < SNARK_FIELD_SIZE && x >= 0, "G1Point x out of range");
    assert(y < SNARK_FIELD_SIZE && y >= 0, "G1Point y out of range");
    this.x = x;
    this.y = y;
  }

  /**
   * Check whether two points are equal
   * @param pt the point to compare with
   * @returns whether they are equal or not
   */
  equals(pt: G1Point): boolean {
    return this.x === pt.x && this.y === pt.y;
  }

  /**
   * Return the point as a contract param in the form of an object
   * @returns the point as a contract param
   */
  asContractParam(): { x: string; y: string } {
    return {
      x: this.x.toString(),
      y: this.y.toString(),
    };
  }
}

/**
 * @notice A class representing a point on the second group (G2)
 * of the Jubjub curve. This is usually an extension field of the
 * base field of the curve.
 */
export class G2Point {
  x: bigint[];

  y: bigint[];

  constructor(x: bigint[], y: bigint[]) {
    this.checkPointsRange(x, "x");
    this.checkPointsRange(y, "y");

    this.x = x;
    this.y = y;
  }

  /**
   * Check whether two points are equal
   * @param pt the point to compare with
   * @returns whether they are equal or not
   */
  equals(pt: G2Point): boolean {
    return this.x[0] === pt.x[0] && this.x[1] === pt.x[1] && this.y[0] === pt.y[0] && this.y[1] === pt.y[1];
  }

  /**
   * Return the point as a contract param in the form of an object
   * @returns the point as a contract param
   */
  asContractParam(): { x: string[]; y: string[] } {
    return {
      x: this.x.map((n) => n.toString()),
      y: this.y.map((n) => n.toString()),
    };
  }

  private checkPointsRange(x: bigint[], type: "x" | "y") {
    assert(
      x.every((n) => n < SNARK_FIELD_SIZE && n >= 0),
      `G2Point ${type} out of range`,
    );
  }
}

/**
 * Hash an array of uint256 values the same way that the EVM does.
 * @param input - the array of values to hash
 * @returns a EVM compatible sha256 hash
 */
export const sha256Hash = (input: bigint[]): bigint => {
  const types: string[] = [];

  input.forEach(() => {
    types.push("uint256");
  });

  return (
    BigInt(
      utils.soliditySha256(
        types,
        input.map((x) => x.toString()),
      ),
    ) % SNARK_FIELD_SIZE
  );
};

/**
 * Generate the poseidon hash of the inputs provided
 * @param inputs The inputs to hash
 * @returns the hash of the inputs
 */
export const poseidon = (inputs: bigint[]): bigint => poseidonPerm([BigInt(0), ...inputs.map((x) => BigInt(x))])[0];

/**
 * Hash up to 2 elements
 * @param inputs The elements to hash
 * @returns the hash of the elements
 */
export const poseidonT3 = (inputs: bigint[]): bigint => {
  assert(inputs.length === 2);
  return poseidon(inputs);
};

/**
 * Hash up to 3 elements
 * @param inputs The elements to hash
 * @returns the hash of the elements
 */
export const poseidonT4 = (inputs: bigint[]): bigint => {
  assert(inputs.length === 3);
  return poseidon(inputs);
};

/**
 * Hash up to 4 elements
 * @param inputs The elements to hash
 * @retuns the hash of the elements
 */
export const poseidonT5 = (inputs: bigint[]): bigint => {
  assert(inputs.length === 4);
  return poseidon(inputs);
};

/**
 * Hash up to 5 elements
 * @param inputs The elements to hash
 * @returns the hash of the elements
 */
export const poseidonT6 = (inputs: bigint[]): bigint => {
  assert(inputs.length === 5);
  return poseidon(inputs);
};

/**
 * Hash two BigInts with the Poseidon hash function
 * @param left The left-hand element to hash
 * @param right The right-hand element to hash
 * @returns The hash of the two elements
 */
export const hashLeftRight = (left: bigint, right: bigint): bigint => poseidonT3([left, right]);

const funcs: PoseidonFuncs = {
  2: poseidonT3,
  3: poseidonT4,
  4: poseidonT5,
  5: poseidonT6,
};

/**
 * Hash up to N elements
 * @param numElements The number of elements to hash
 * @param elements The elements to hash
 * @returns The hash of the elements
 */
export const hashN = (numElements: number, elements: bigint[]): bigint => {
  const elementLength = elements.length;
  if (elements.length > numElements) {
    throw new TypeError(`the length of the elements array should be at most ${numElements}; got ${elements.length}`);
  }
  const elementsPadded = elements.slice();
  if (elementLength < numElements) {
    for (let i = elementLength; i < numElements; i += 1) {
      elementsPadded.push(BigInt(0));
    }
  }

  return funcs[numElements](elementsPadded);
};

// hash functions
export const hash2 = (elements: bigint[]): bigint => hashN(2, elements);
export const hash3 = (elements: bigint[]): bigint => hashN(3, elements);
export const hash4 = (elements: bigint[]): bigint => hashN(4, elements);
export const hash5 = (elements: bigint[]): bigint => hashN(5, elements);

/**
 * A convenience function to use Poseidon to hash a Plaintext with
 * no more than 13 elements
 * @param elements The elements to hash
 * @returns The hash of the elements
 */
export const hash13 = (elements: bigint[]): bigint => {
  const max = 13;
  const elementLength = elements.length;
  if (elementLength > max) {
    throw new TypeError(`the length of the elements array should be at most ${max}; got ${elements.length}`);
  }
  const elementsPadded = elements.slice();
  if (elementLength < max) {
    for (let i = elementLength; i < max; i += 1) {
      elementsPadded.push(BigInt(0));
    }
  }
  return poseidonT6([
    elementsPadded[0],
    poseidonT6(elementsPadded.slice(1, 6)),
    poseidonT6(elementsPadded.slice(6, 11)),
    elementsPadded[11],
    elementsPadded[12],
  ]);
};

/**
 * Hash a single BigInt with the Poseidon hash function
 * @param preImage The element to hash
 * @returns The hash of the element
 */
export const hashOne = (preImage: bigint): bigint => poseidonT3([preImage, BigInt(0)]);

/**
 * Returns a BabyJub-compatible random value. We create it by first generating
 * a random value (initially 256 bits large) modulo the snark field size as
 * described in EIP197. This results in a key size of roughly 253 bits and no
 * more than 254 bits. To prevent modulo bias, we then use this efficient
 * algorithm:
 * http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c
 * @returns A BabyJub-compatible random value.
 */
export const genRandomBabyJubValue = (): bigint => {
  // Prevent modulo bias
  // const lim = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000')
  // const min = (lim - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE
  const min = BigInt("6350874878119819312338956282401532410528162663560392320966563075034087161851");

  let privKey = SNARK_FIELD_SIZE;

  do {
    const rand = BigInt(`0x${randomBytes(32).toString("hex")}`);

    if (rand >= min) {
      privKey = rand % SNARK_FIELD_SIZE;
    }
  } while (privKey >= SNARK_FIELD_SIZE);

  return privKey;
};

/**
 * Generate a private key
 * @returns A BabyJub-compatible private key.
 */
export const genPrivKey = (): bigint => genRandomBabyJubValue();

/**
 * Generate a random value
 * @returns A BabyJub-compatible salt.
 */
export const genRandomSalt = (): bigint => genRandomBabyJubValue();

/**
 * An internal function which formats a random private key to be compatible
 * with the BabyJub curve. This is the format which should be passed into the
 * PubKey and other circuits.
 * @param privKey A private key generated using genPrivKey()
 * @returns A BabyJub-compatible private key.
 */
export const formatPrivKeyForBabyJub = (privKey: PrivKey): bigint => BigInt(deriveSecretScalar(privKey));

/**
 * @param privKey A private key generated using genPrivKey()
 * @returns A public key associated with the private key
 */
export const genPubKey = (privKey: PrivKey): PubKey => {
  // Check whether privKey is a field element
  assert(BigInt(privKey) < SNARK_FIELD_SIZE);

  const key = derivePublicKey(privKey);
  return [BigInt(key[0]), BigInt(key[1])];
};

/**
 * Generates a keypair.
 * @returns a keypair
 */
export const genKeypair = (): Keypair => {
  const privKey = genPrivKey();
  const pubKey = genPubKey(privKey);

  const keypair: Keypair = { privKey, pubKey };

  return keypair;
};

/**
 * Generates an Elliptic-Curve Diffie–Hellman (ECDH) shared key given a private
 * key and a public key.
 * @param privKey A private key generated using genPrivKey()
 * @param pubKey A public key generated using genPubKey()
 * @returns The ECDH shared key.
 */
export const genEcdhSharedKey = (privKey: PrivKey, pubKey: PubKey): EcdhSharedKey =>
  mulPointEscalar(pubKey as Point<bigint>, formatPrivKeyForBabyJub(privKey));

/**
 * Losslessly reduces the size of the representation of a public key
 * @param pubKey The public key to pack
 * @returns A packed public key
 */
export const packPubKey = (pubKey: PubKey): bigint => BigInt(packPublicKey(pubKey));

/**
 * Restores the original PubKey from its packed representation
 * @param packed The value to unpack
 * @returns The unpacked public key
 */
export const unpackPubKey = (packed: bigint): PubKey => {
  const pubKey = unpackPublicKey(packed);
  return pubKey.map((x: string) => BigInt(x)) as PubKey;
};
