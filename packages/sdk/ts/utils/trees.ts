/**
 * Utility to calculate the depth of a binary tree
 * @param maxLeaves - the number of leaves in the tree
 * @returns the depth of the tree
 */
export const calculateBinaryTreeDepthFromMaxLeaves = (maxLeaves: number): number => {
  let result = 0;

  while (2 ** result < maxLeaves) {
    result += 1;
  }

  return result;
};

/**
 * Utility to calculate the depth of a quin tree
 * @param maxLeaves the number of leaves in the tree
 * @returns the depth of the tree
 */
export const calculateQuinTreeDepthFromMaxLeaves = (maxLeaves: number): number => {
  let result = 0;

  while (5 ** result < maxLeaves) {
    result += 1;
  }

  return result;
};
