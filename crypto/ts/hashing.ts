import { poseidonPerm } from "@zk-kit/poseidon-cipher";
import { solidityPackedSha256 } from "ethers";

import assert from "assert";

import type { Plaintext, PoseidonFuncs } from "./types";

import { SNARK_FIELD_SIZE } from "./constants";

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
      solidityPackedSha256(
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

// hash functions
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
export const hashN = (numElements: number, elements: Plaintext): bigint => {
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
export const hash2 = (elements: Plaintext): bigint => hashN(2, elements);
export const hash3 = (elements: Plaintext): bigint => hashN(3, elements);
export const hash4 = (elements: Plaintext): bigint => hashN(4, elements);
export const hash5 = (elements: Plaintext): bigint => hashN(5, elements);

/**
 * A convenience function to use Poseidon to hash a Plaintext with
 * no more than 13 elements
 * @param elements The elements to hash
 * @returns The hash of the elements
 */
export const hash13 = (elements: Plaintext): bigint => {
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
