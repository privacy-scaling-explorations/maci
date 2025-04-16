pragma circom 2.0.0;

// zk-kit imports
include "./safe-comparators.circom";
// local import
include "../CalculateTotal.circom";

/**
 * Calculates the path indices required for Merkle proof verifications. 
 * Given a node index within an IMT and the total tree levels, it outputs the path indices leading to that node.
 * The template handles the modulo and division operations to break down the tree index into its constituent path indices.
 */
template MerkleGeneratePathIndices(levels) {
    // The base used for the modulo and division operations, set to 2 for binary trees.
    var BASE = 2;

    // The total sum of the path indices.
    signal input indices;

    // The generated path indices.
    signal output out[levels];

    var computedIndices = indices;
    var computedResults[levels];

    for (var i = 0; i < levels; i++) {
        // circom's best practices suggests to avoid using <-- unless you
        // are aware of what's going on. This is the only way to do modulo operation.
        out[i] <-- computedIndices % BASE;
        computedIndices = computedIndices \ BASE;

        // Check that each output element is less than the base.
        var computedIsOutputElementLessThanBase = SafeLessThan(3)([out[i], BASE]);
        computedIsOutputElementLessThanBase === 1;

        // Re-compute the total sum.
        computedResults[i] = out[i] * (BASE ** i);
    }
    
    // Check that the total sum matches the index.
    var computedCalculateTotal = CalculateTotal(levels)(computedResults);

    computedCalculateTotal === indices;
} 
