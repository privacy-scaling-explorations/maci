pragma circom 2.0.0;

// local import
include "../hashers.circom";

// Given a list of leaves, compute the root of the merkle tree
// by inserting all the leaves into the tree in the given
// order.
template QuinCheckRoot(levels) {
    var LEAVES_PER_NODE = 5;

    // The total number of leaves
    var totalLeaves = LEAVES_PER_NODE ** levels;

    // The number of Hasher5 components which will be used to hash the
    // leaves
    var numLeafHashers = LEAVES_PER_NODE ** (levels - 1);

    // Inputs to the snark
    signal input leaves[totalLeaves];

    // The output
    signal output root;

    var i;
    var j;

    // The total number of hashers
    var numHashers = 0;
    for (i = 0; i < levels; i++) {
        numHashers += LEAVES_PER_NODE ** i;
    }

    var hashers[numHashers];

    // Wire the leaf values into the leaf hashers
    for (i = 0; i < numLeafHashers; i++){
        hashers[i] = PoseidonHasher(5)([
            leaves[i*LEAVES_PER_NODE+0],
            leaves[i*LEAVES_PER_NODE+1],
            leaves[i*LEAVES_PER_NODE+2],
            leaves[i*LEAVES_PER_NODE+3],
            leaves[i*LEAVES_PER_NODE+4]            
        ]);
    }

    // Wire the outputs of the leaf hashers to the intermediate hasher inputs
    var k = 0;
    for (i = numLeafHashers; i < numHashers; i++) {
        hashers[i] = PoseidonHasher(5)([
            hashers[k*LEAVES_PER_NODE+0],
            hashers[k*LEAVES_PER_NODE+1],
            hashers[k*LEAVES_PER_NODE+2],
            hashers[k*LEAVES_PER_NODE+3],
            hashers[k*LEAVES_PER_NODE+4]            
        ]);
        k++;
    }

    // Wire the output of the final hash to this circuit's output
    root <== hashers[numHashers-1];
}

