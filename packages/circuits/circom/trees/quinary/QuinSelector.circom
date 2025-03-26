pragma circom 2.0.0;

// zk-kit imports
include "./safe-comparators.circom";
// local imports
include "../../utils/calculateTotal.circom";

/**
 * Selects an item from a list based on the given index.
 * It verifies the index is within the valid range and then iterates over the inputs to find the match.
 * For each item, it checks if its position equals the given index and if so, multiplies the item 
 * by the result of the equality check, effectively selecting it.
 * The sum of these results yields the selected item, ensuring only the item at the specified index be the output.
 *
 * nb. The number of items must be less than 8, and the index must be less than the number of items.
 */
template QuinSelector(choices) {
    signal input in[choices];
    signal input index;
    signal output out;
    
    // Ensure that index < choices.
    var computedLtIndex = SafeLessThan(3)([index, choices]);
    computedLtIndex === 1;

    // Initialize an array to hold the results of equality checks.
    var computedResults[choices];

    // For each item, check whether its index equals the input index.
    // The result is multiplied by the corresponding input value.
    for (var i = 0; i < choices; i++) {
        var computedIsIndexEqual = IsEqual()([i, index]);

        computedResults[i] = computedIsIndexEqual * in[i];
    }

    // Calculate the total sum of the results array.
    out <== CalculateTotal(choices)(computedResults);
} 
