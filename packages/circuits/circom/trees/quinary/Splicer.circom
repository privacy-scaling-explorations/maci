pragma circom 2.0.0;

// circomlib imports
include "./mux1.circom";
// zk-kit imports
include "./safe-comparators.circom";
// local imports
include "./QuinSelector.circom";

/**
 * The output array contains the input items, with the leaf inserted at the
 * specified index. For example, if input = [0, 20, 30, 40], index = 3, and
 * leaf = 10, the output will be [0, 20, 30, 10, 40].
 */
template Splicer(numItems) {
    // The number of output items (because only one item is inserted).
    var NUM_OUTPUT_ITEMS = numItems + 1;

    signal input in[numItems];
    signal input leaf;
    signal input index;
    signal output out[NUM_OUTPUT_ITEMS];
    
    // There is a loop where the goal is to assign values to the output signal.
    // 
    //  | output[0] | output[1] | output[2] | ...
    // 
    // We can either assign the leaf, or an item from the `items` signal, to the output, using Mux1().
    // The Mux1's selector is 0 or 1 depending on whether the index is equal to the loop counter.
    // 
    //  i --> [IsEqual] <-- index
    //             |
    //             v
    //  leaf --> [Mux1] <-- <item from in>
    //             |
    //             v
    //          output[m]
    // 
    // To obtain the value from <item from in>, we need to compute an item
    // index (let it be `s`).
    // 1. if index = 2 and i = 0, then s = 0
    // 2. if index = 2 and i = 1, then s = 1
    // 3. if index = 2 and i = 2, then s = 2
    // 4. if index = 2 and i = 3, then s = 2
    // 5. if index = 2 and i = 4, then s = 3
    // We then wire `s`, as well as each item in `in` to a QuinSelector.
    // The output signal from the QuinSelector is <item from in> and gets
    // wired to Mux1 (as above).

    var inputs[NUM_OUTPUT_ITEMS];

    for (var i = 0; i < numItems; i++) {
        inputs[i] = in[i];
    }
    inputs[NUM_OUTPUT_ITEMS - 1] = 0;

    for (var i = 0; i < NUM_OUTPUT_ITEMS; i++) {
        // Determines if current index is greater than the insertion index.
        var computedIsIndexAfterInsertPoint = SafeGreaterThan(3)([i, index]);

        // Calculates correct index for original items, adjusting for leaf insertion.
        var computedAdjustedIndex = i - computedIsIndexAfterInsertPoint;

        // Selects item from the original array or the leaf for insertion.
        var computedQuinSelected = QuinSelector(NUM_OUTPUT_ITEMS)(inputs, computedAdjustedIndex);
        var computedIsIndexEqual = IsEqual()([index, i]);
        var mux = Mux1()([computedQuinSelected, leaf], computedIsIndexEqual);

        out[i] <== mux;
    }
} 