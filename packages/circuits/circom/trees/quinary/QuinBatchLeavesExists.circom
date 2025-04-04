pragma circom 2.0.0;

include "./QuinCheckRoot.circom";
include "./QuinTreeInclusionProof.circom";

/**
 * Checks if a list of leaves exists within an IQT, leveraging the PoseidonT6
 * circuit for hashing. This can be used to verify the presence of multiple leaves.
 */
template QuinBatchLeavesExists(levels, batchLevels) {
    var LEAVES_PER_NODE = 5;
    var LEAVES_PER_PATH_LEVEL = LEAVES_PER_NODE - 1;
    var LEAVES_PER_BATCH = LEAVES_PER_NODE ** batchLevels;

    signal input root;
    signal input leaves[LEAVES_PER_BATCH];
    signal input path_index[levels - batchLevels];
    signal input path_elements[levels - batchLevels][LEAVES_PER_PATH_LEVEL];

    // Compute the subroot (= leaf).
    var computedQuinSubroot = QuinCheckRoot(batchLevels)(leaves);

    // Check if the Merkle path is valid
    QuinLeafExists(levels - batchLevels)(computedQuinSubroot, path_index, path_elements, root);
} 