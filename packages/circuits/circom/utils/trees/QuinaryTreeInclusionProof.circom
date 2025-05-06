pragma circom 2.0.0;

// local imports
include "../PoseidonHasher.circom";
include "./Splicer.circom";

/**
 * Computes the root of an IQT given a leaf, its path, and sibling nodes at each level of the tree. 
 * It iteratively incorporates the leaf or the hash from the previous level with sibling nodes using 
 * the Splicer to place the leaf or hash at the correct position based on path_indices. 
 * Then, it hashes these values together with PoseidonHasher to move up the tree. 
 * This process repeats for each level (levels) of the tree, culminating in the computation of the tree's root.
 */
template QuinaryTreeInclusionProof(levels) {
    // The number of leaves per node (tree arity)
    var LEAVES_PER_NODE = 5;
    // Number of leaves per path level (excluding the leaf itself)
    var LEAVES_PER_PATH_LEVEL = LEAVES_PER_NODE - 1;

    // The leaf to check for inclusion
    signal input leaf;
    // The path indices at each level of the tree
    signal input path_indices[levels];
    // The sibling nodes at each level of the tree
    signal input path_elements[levels][LEAVES_PER_PATH_LEVEL];
    // The computed root of the tree
    signal output root;

    var currentLeaf = leaf;

    // Iteratively hash each level of path_elements with the leaf or previous hash
    for (var i = 0; i < levels; i++) {
        var elements[LEAVES_PER_PATH_LEVEL];

        for (var j = 0; j < LEAVES_PER_PATH_LEVEL; j++) {
            elements[j] = path_elements[i][j];
        }

        var computedSplicedLeaf[LEAVES_PER_NODE] = Splicer(LEAVES_PER_PATH_LEVEL)(
            elements, 
            currentLeaf, 
            path_indices[i]
        );

        currentLeaf = PoseidonHasher(5)([
            computedSplicedLeaf[0],
            computedSplicedLeaf[1],
            computedSplicedLeaf[2],
            computedSplicedLeaf[3],
            computedSplicedLeaf[4]
        ]);
    }

    root <== currentLeaf;
}