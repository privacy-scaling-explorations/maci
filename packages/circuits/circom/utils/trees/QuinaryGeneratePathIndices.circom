pragma circom 2.0.0;

// zk-kit import
include "./safe-comparators.circom";
// local imports
include "../CalculateTotal.circom";

/**
 * Calculates the path indices required for Merkle proof verifications (e.g., QuinaryTreeInclusionProof, QuinaryLeafExists). 
 * Given a node index within an IQT and the total tree levels, it outputs the path indices leading to that node.
 * The template handles the modulo and division operations to break down the tree index into its constituent path indices.
 * e.g., if the index is 30 and the number of levels is 4, the output should be [0, 1, 1, 0].
 */
template QuinaryGeneratePathIndices(levels) {
    // The number of leaves per node (tree arity)
    var LEAVES_PER_NODE = 5;

    // The index within the tree
    signal input index;
    // The generated path indices leading to the node of the provided index
    signal output out[levels];

    var indexModulus = index;
    var computedResults[levels];

    for (var i = 0; i < levels; i++) {
        // circom's best practices suggests to avoid using <-- unless you
        // are aware of what's going on. This is the only way to do modulo operation.
        out[i] <-- indexModulus % LEAVES_PER_NODE;
        indexModulus = indexModulus \ LEAVES_PER_NODE;

        // Check that each output element is less than the base.
        var computedIsOutputElementLessThanBase = SafeLessThan(3)([out[i], LEAVES_PER_NODE]);
        computedIsOutputElementLessThanBase === 1;

        // Re-compute the total sum.
        computedResults[i] = out[i] * (LEAVES_PER_NODE ** i);
    }
    
    // Check that the total sum matches the index.
    var computedCalculateTotal = CalculateTotal(levels)(computedResults);

    computedCalculateTotal === index;
}
