pragma circom 2.0.0;

include "./QuinTreeInclusionProof.circom";

/**
 * Verifies if a given leaf exists within an IQT.
 * Takes a leaf, its path to the root (specified by indices and path elements),
 * and the root itself, to verify the leaf's inclusion within the tree.
 */
template QuinLeafExists(levels){
    var LEAVES_PER_NODE = 5;
    var LEAVES_PER_PATH_LEVEL = LEAVES_PER_NODE - 1;

    signal input leaf;
    signal input path_index[levels];
    signal input path_elements[levels][LEAVES_PER_PATH_LEVEL];
    signal input root;

    // Verify the Merkle path.
    var computedRoot = QuinTreeInclusionProof(levels)(leaf, path_index, path_elements);

    root === computedRoot;
} 
