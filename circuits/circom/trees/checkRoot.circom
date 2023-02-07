pragma circom 2.0.0;
include "../hasherPoseidon.circom";

/*template QuinCheckRootWithSha256(levels, subLevels) {*/
    /*// Given a quin Merkle root and a list of leaves, check if the root is the*/
    /*// correct result of inserting all the leaves into the tree in the given*/
    /*// order. Uses SHA256 instead of Poseidon to hash levels up to subLevels*/

    /*assert(levels > 0);*/
    /*assert(subLevels <= levels);*/
    /*var LEAVES_PER_NODE = 5;*/

    /*// The total number of leaves*/
    /*var totalLeaves = LEAVES_PER_NODE ** levels;*/

    /*signal input leaves[totalLeaves];*/
    /*signal output root;*/

    /*// The total number of hashers*/
    /*var numHashers = 0;*/
    /*for (var i = 0; i < levels; i ++) {*/
        /*numHashers += LEAVES_PER_NODE ** i;*/
    /*}*/

    /*// The number of SHA256 hashers*/
    /*var numShaHashers = 0;*/
    /*for (var i = 0; i < subLevels; i ++) {*/
        /*numShaHashers += LEAVES_PER_NODE ** i;*/
    /*}*/

    /*var numPoseidonHashers = numHashers - numShaHashers;*/


/*}*/

template QuinCheckRoot(levels) {
    // Given a quin Merkle root and a list of leaves, check if the root is the
    // correct result of inserting all the leaves into the tree in the given
    // order.

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
        k ++;
    }

    // Wire the output of the final hash to this circuit's output
    root <== hashers[numHashers-1].hash;
}

