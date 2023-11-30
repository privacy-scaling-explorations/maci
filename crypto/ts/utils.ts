import ff from "ffjavascript";
import { OptimisedMT as IncrementalQuinTree } from "optimisedmt";

import { hash5, hashLeftRight } from "./crypto";

/**
 * Convert a bigint to a string
 * @param obj - the object to convert
 * @returns the converted object
 */
export const stringifyBigInts = (obj: unknown): unknown => ff.utils.stringifyBigInts(obj);

/**
 * Convert a string to a bigint
 * @param obj - the object to convert
 * @returns the converted object
 */
export const unstringifyBigInts = (obj: unknown): unknown => ff.utils.unstringifyBigInts(obj);

/**
 * Create a copy of a bigint array
 * @param arr - the array of bigints to copy
 * @returns a deep copy of the array
 */
export const deepCopyBigIntArray = (arr: bigint[]): bigint[] => arr.map((x) => BigInt(x.toString()));

/**
 * Calculate the depth of a tree given the number of leaves
 * @param hashLength the hashing function param length
 * @param numLeaves how many leaves
 * @returns the depth
 */
export const calcDepthFromNumLeaves = (hashLength: number, numLeaves: number): number => {
  let depth = 1;
  let max = hashLength ** depth;

  while (BigInt(max) < numLeaves) {
    depth += 1;
    max = hashLength ** depth;
  }

  return depth;
};

/**
 * A helper function which hashes a list of results with a salt and returns the
 * hash.
 * @param leaves A list of values
 * @param salt A random salt
 * @returns The hash of the leaves and the salt, with the salt last
 */
export const genTreeCommitment = (leaves: bigint[], salt: bigint, depth: number): bigint => {
  const tree = new IncrementalQuinTree(depth, BigInt(0), 5, hash5);

  leaves.forEach((leaf) => {
    tree.insert(leaf);
  });

  return hashLeftRight(tree.root, salt);
};
