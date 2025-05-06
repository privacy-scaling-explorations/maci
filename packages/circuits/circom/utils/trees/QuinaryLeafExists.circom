pragma circom 2.0.0;

// local imports
include "./QuinaryTreeInclusionProof.circom";

/**
 * Verifies if a given leaf exists within an IQT.
 * Takes a leaf, its path to the root (specified by indices and path elements),
 * and the root itself, to verify the leaf's inclusion within the tree.
 */
template QuinaryLeafExists(levels){
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
    signal input root;

    // Verify the Merkle path.
    var computedRoot = QuinaryTreeInclusionProof(levels)(leaf, path_indices, path_elements);

    root === computedRoot;
}
