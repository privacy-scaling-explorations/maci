include "../node_modules/circomlib/circuits/comparators.circom";
include "./hasherPoseidon.circom";
include "./calculateTotal.circom";

// This file contains circuits for Merkle tree verifcation.
// It assumes that each node contains 5 leaves. This is because we use the
// PoseidonT6 circuit to hash leaves, which supports 5 input elements.

// Circom has some perticularities which limit the code patterns we can
// use.

// You can only assign a value to a signal once.

// A component's input signal must only be wired to another component's output
// signal.

// Variables are only used for loops, declaring sizes of things, and anything
// that is not related to inputs of a circuit.

template QuadCheckRoot(levels) {
    // Given a quad Merkle root and a list of leaves, check if the root is the
    // correct result of inserting all the leaves into the tree in the given
    // order.

    var LEAVES_PER_NODE = 5;

    // The total number of leaves
    var totalLeaves = LEAVES_PER_NODE ** levels;

    // The number of Hasher5 components which will be used to hash the
    // leaves
    var numLeafHashers = LEAVES_PER_NODE ** (levels - 1);

    // Inputs to the snark
    signal private input leaves[totalLeaves];

    // The output
    signal output root;

    var i;
    var j;

    // The total number of hashers
    var numHashers = 0;
    for (i = 0; i < levels; i ++) {
        numHashers += LEAVES_PER_NODE ** i;
    }

    component hashers[numHashers];

    // Instantiate all hashers
    for (i = 0; i < numHashers; i ++) {
        hashers[i] = Hasher5();
    }

    // Wire the leaf values into the leaf hashers
    for (i = 0; i < numLeafHashers; i ++){
        for (j = 0; j < LEAVES_PER_NODE; j ++){
            hashers[i].in[j] <== leaves[i * LEAVES_PER_NODE + j];
        }
    }

    // Wire the outputs of the leaf hashers to the intermediate hasher inputs
    var k = 0;
    for (i = numLeafHashers; i < numHashers; i ++) {
        for (j = 0; j < LEAVES_PER_NODE; j ++){
            hashers[i].in[j] <== hashers[k * LEAVES_PER_NODE + j].hash;
        }
        k++;
    }

    // Wire the output of the final hash to this circuit's output
    root <== hashers[numHashers-1].hash;
}

/*
 * Given a list of items and an index, output the item at the position denoted
 * by the index. The number of items must be less than 8, and the index must
 * be less than the number of items.
 */
template QuadSelector(choices) {
    signal input items[choices];
    signal input index;
    signal output selected;
    
    // Ensure that index < choices
    component lessThan = LessThan(3);
    lessThan.in[0] <== index;
    lessThan.in[1] <== choices;
    lessThan.out === 1;

    component calcTotal = CalculateTotal(choices);
    component eqs[choices];

    // For each item, check whether its index equals the input index.
    for (var i = 0; i < choices; i ++) {
        eqs[i] = IsEqual();
        eqs[i].in[0] <== i;
        eqs[i].in[1] <== index

        // eqs[i].out is 1 if the index matches. As such, at most one input to
        // calcTotal is not 0.
        calcTotal.nums[i] <== eqs[i].out * items[i];
    }

    // Returns 0 + 0 + 0 + item
    selected <== calcTotal.sum;
}

template QuadTreeInclusionProof(levels) {
    // Each node has 5 leaves
    var LEAVES_PER_NODE = 5;

    signal input indices[levels];
    signal input pathElements[levels][LEAVES_PER_NODE];
    signal output root;

    var i;
    var j;

    // Hash each level of pathElements
    component hashers[levels];

    for (i = 0; i < levels; i++) {
        hashers[i] = Hasher5();
        for (j = 0; j < LEAVES_PER_NODE; j ++) {
            hashers[i].in[j] <== pathElements[i][j];
        }
    }

    // Verify each hash
    component selectors[levels - 1];
    for (i = 0; i < levels - 1; i++) {
        selectors[i] = QuadSelector(LEAVES_PER_NODE);
        selectors[i].index <== indices[i];

        for (j = 0; j < LEAVES_PER_NODE; j ++) {
            selectors[i].items[j] <== pathElements[i + 1][j];
        }

        hashers[i].hash === selectors[i].selected;
    }
    
    // Compute the root and assign it to the output signal
    component rootHasher = Hasher5();
    for (i = 0; i < LEAVES_PER_NODE; i ++) {
        rootHasher.in[i] <== pathElements[levels - 1][i];
    }
    root <== rootHasher.hash;
}
