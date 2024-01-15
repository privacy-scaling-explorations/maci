import { hash5, hashLeftRight } from "./hashing";
import { IncrementalQuinTree } from "./quinTree";

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
 * @param depth The tree depth
 * @returns The hash of the leaves and the salt, with the salt last
 */
export const genTreeCommitment = (leaves: bigint[], salt: bigint, depth: number): bigint => {
  const tree = new IncrementalQuinTree(depth, 0n, 5, hash5);

  leaves.forEach((leaf) => {
    tree.insert(leaf);
  });

  return hashLeftRight(tree.root, salt);
};

/**
 * A helper function to generate the tree proof for the value at the given index in the leaves
 * @param index The index of the value to generate the proof for
 * @param leaves A list of values
 * @param depth The tree depth
 * @returns The proof
 */
export const genTreeProof = (index: number, leaves: bigint[], depth: number): bigint[][] => {
  const tree = new IncrementalQuinTree(depth, 0n, 5, hash5);
  leaves.forEach((leaf) => {
    tree.insert(leaf);
  });

  const proof = tree.genProof(index);
  return proof.pathElements;
};
