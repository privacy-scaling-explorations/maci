pragma circom 2.0.0;

// circomlib imports
include "./bitify.circom";
// zk-kit imports
include "./safe-comparators.circom";
// local imports
include "../../utils/calculateTotal.circom";

/**
 * Calculates the path indices required for Merkle proof verifications (e.g., QuinTreeInclusionProof, QuinLeafExists). 
 * Given a node index within an IQT and the total tree levels, it outputs the path indices leading to that node.
 * The template handles the modulo and division operations to break down the tree index into its constituent path indices.
 * e.g., if the index is 30 and the number of levels is 4, the output should be [0, 1, 1, 0].
 */
template QuinGeneratePathIndices(levels) {
    var BASE = 5;

    signal input in; 
    signal output out[levels];

    var m = in;
    var computedResults[levels];

    for (var i = 0; i < levels; i++) {
        // circom's best practices suggests to avoid using <-- unless you
        // are aware of what's going on. This is the only way to do modulo operation.
        out[i] <-- m % BASE;
        m = m \ BASE;

        // Check that each output element is less than the base.
        var computedIsOutputElementLessThanBase = SafeLessThan(3)([out[i], BASE]);
        computedIsOutputElementLessThanBase === 1;

        // Re-compute the total sum.
        computedResults[i] = out[i] * (BASE ** i);
    }
    
    // Check that the total sum matches the index.
    var computedCalculateTotal = CalculateTotal(levels)(computedResults);

    computedCalculateTotal === in;
} 