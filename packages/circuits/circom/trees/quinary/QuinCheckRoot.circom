pragma circom 2.0.0;

include "../../utils/hashers.circom";

/**
 * Verifies the correct construction of a quinary Merkle tree from a set of leaves.
 * Given a list of leaves, check if the root is the correct result of inserting
 * all the leaves into the tree (in the given order).
 */
template QuinCheckRoot(levels) {
    var LEAVES_PER_NODE = 5;
    var totalLeaves = LEAVES_PER_NODE ** levels;

    signal input leaves[totalLeaves];
    signal output root;

    var currentLevel[totalLeaves];
    for (var i = 0; i < totalLeaves; i++) {
        currentLevel[i] = leaves[i];
    }

    var nodesInLevel = totalLeaves;
    var offset = 0;

    for (var i = 0; i < levels; i++) {
        var nextLevelNodes = nodesInLevel / LEAVES_PER_NODE;
        
        for (var j = 0; j < nextLevelNodes; j++) {
            var baseIndex = j * LEAVES_PER_NODE;
            
            currentLevel[offset + j] = PoseidonHasher(5)([
                currentLevel[baseIndex],
                currentLevel[baseIndex + 1],
                currentLevel[baseIndex + 2],
                currentLevel[baseIndex + 3],
                currentLevel[baseIndex + 4]
            ]);
        }

        offset += nextLevelNodes;
        nodesInLevel = nextLevelNodes;
    }

    root <== currentLevel[offset - 1];
} 
