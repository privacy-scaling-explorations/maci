pragma circom 2.0.0;

include "../../utils/hashers.circom";

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