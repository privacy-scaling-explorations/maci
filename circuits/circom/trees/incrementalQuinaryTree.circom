pragma circom 2.0.0;

// circomlib imports
include "./bitify.circom";
include "./mux1.circom";
// zk-kit import
include "./safe-comparators.circom";
// local imports
include "../utils/calculateTotal.circom";
include "../utils/hashers.circom";

// Incremental Quintary Merkle Tree (IQT) verification circuits.
// Since each node contains 5 leaves, we are using PoseidonT6 for hashing them.
// 
// nb. circom has some particularities which limit the code patterns we can use:
//  - You can only assign a value to a signal once.
//  - A component's input signal must only be wired to another component's output signal.
//  - Variables can store linear combinations, and can also be used for loops,
//    declaring sizes of things, and anything that is not related to inputs of a circuit.
//  - The compiler fails whenever you try to mix invalid elements.
//  - You can't use a signal as a list index.

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

/**
 * Computes the root of an IQT given a leaf, its path, and sibling nodes at each level of the tree. 
 * It iteratively incorporates the leaf or the hash from the previous level with sibling nodes using 
 * the Splicer to place the leaf or hash at the correct position based on path_index. 
 * Then, it hashes these values together with PoseidonHasher to move up the tree. 
 * This process repeats for each level (levels) of the tree, culminating in the computation of the tree's root.
 */
template QuinTreeInclusionProof(levels) {
    var LEAVES_PER_NODE = 5;
    var LEAVES_PER_PATH_LEVEL = LEAVES_PER_NODE - 1;

    signal input leaf;
    signal input path_index[levels];
    signal input path_elements[levels][LEAVES_PER_PATH_LEVEL];
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
            path_index[i]
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

/**
 * Computes the root of a quintary Merkle tree given a list of leaves.
 * This template constructs a Merkle tree with each node having 5 children (quintary)
 * and computes the root by hashing with Poseidon the leaves and intermediate nodes in the given order.
 * The computation is performed by first hashing groups of 5 leaves to form the bottom layer of nodes,
 * then recursively hashing groups of these nodes to form the next layer, and so on, until the root is computed.
 */
template QuinCheckRoot(levels) {
    var LEAVES_PER_NODE = 5;
    var totalLeaves = LEAVES_PER_NODE ** levels;
    var numLeafHashers = LEAVES_PER_NODE ** (levels - 1); 

    signal input leaves[totalLeaves];
    signal output root;

    // Determine the total number of hashers.
    var numHashers = 0;
    for (var i = 0; i < levels; i++) {
        numHashers += LEAVES_PER_NODE ** i;
    }

    var computedHashers[numHashers]; 

    // Initialize hashers for the leaves.
    for (var i = 0; i < numLeafHashers; i++) {
        computedHashers[i] = PoseidonHasher(5)([
            leaves[i * LEAVES_PER_NODE + 0],
            leaves[i * LEAVES_PER_NODE + 1],
            leaves[i * LEAVES_PER_NODE + 2],
            leaves[i * LEAVES_PER_NODE + 3],
            leaves[i * LEAVES_PER_NODE + 4]
        ]);
    }

    // Initialize hashers for intermediate nodes and compute the root.
    var k = 0;
    for (var i = numLeafHashers; i < numHashers; i++) {
        computedHashers[i] = PoseidonHasher(5)([
            computedHashers[k * LEAVES_PER_NODE + 0],
            computedHashers[k * LEAVES_PER_NODE + 1],
            computedHashers[k * LEAVES_PER_NODE + 2],
            computedHashers[k * LEAVES_PER_NODE + 3],
            computedHashers[k * LEAVES_PER_NODE + 4]
        ]);
        k++;
    }

    root <== computedHashers[numHashers - 1]; 
}