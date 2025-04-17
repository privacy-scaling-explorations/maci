pragma circom 2.0.0;

// local import
include "../PoseidonHasher.circom";

/**
 * Verifies the correct construction of a Merkle tree from a set of leaves.
 * Given a Merkle root and a list of leaves, check if the root is the
 * correct result of inserting all the leaves into the tree (in the given order).
 */
template CheckRoot(levels) {
    // The total number of leaves in the Merkle tree, calculated as 2 to the power of `levels`.
    var TOTAL_LEVELS = 2 ** levels;
    // The number of first-level hashers needed, equal to half the total leaves, as each hasher combines two leaves.
    var LEAF_HASHERS = TOTAL_LEVELS / 2;
    // The number of intermediate hashers, one less than the number of leaf hashers, 
    // as each level of hashing reduces the number of hash elements by about half.
    var INTERMEDIATE_HASHERS = LEAF_HASHERS - 1;
    
    // Array of leaf values input to the circuit.
    signal input leaves[TOTAL_LEVELS];

    // Output signal for the Merkle root that results from hashing all the input leaves.
    signal output root;

    // Total number of hashers used in constructing the tree, one less than the total number of leaves,
    // since each level of the tree combines two elements into one.
    var hashersLength = TOTAL_LEVELS - 1;
    var computedLevelHashers[hashersLength];

    // Initialize hashers for the leaves, each taking two adjacent leaves as inputs.
    for (var i = 0; i < LEAF_HASHERS; i++){
        computedLevelHashers[i] = PoseidonHasher(2)([leaves[i * 2], leaves[i * 2 + 1]]);
    }

    // Initialize hashers for intermediate levels, each taking the outputs of two hashers from the previous level.
    var index = 0;

    for (var i = LEAF_HASHERS; i < LEAF_HASHERS + INTERMEDIATE_HASHERS; i++) {
        computedLevelHashers[i] = PoseidonHasher(2)([
            computedLevelHashers[index * 2],
            computedLevelHashers[index * 2 + 1]
        ]);
        index++;
    }

    // Connect the output of the final hasher in the array to the root output signal.
    root <== computedLevelHashers[hashersLength - 1];
} 
