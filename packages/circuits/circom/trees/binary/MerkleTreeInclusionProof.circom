pragma circom 2.0.0;

// circomlib imports
include "./mux1.circom";
// zk-kit imports
include "./safe-comparators.circom";
// local imports
include "../../utils/hashers.circom";

/**
 * Recomputes a Merkle root from a given leaf and its path in a Merkle tree.
 */
template MerkleTreeInclusionProof(n_levels) {
    // The leaf node from which the Merkle root is calculated.
    signal input leaf;
    // Indices indicating left or right child for each level of the tree.
    signal input path_index[n_levels];
    // Sibling node values required to compute the hash at each level.
    signal input path_elements[n_levels][1];

    signal output root;

     // Stores the hash at each level starting from the leaf to the root.
    signal levelHashes[n_levels + 1];
    // Initialize the first level with the given leaf.
    levelHashes[0] <== leaf;

    for (var i = 0; i < n_levels; i++) {
        // Validate path_index to be either 0 or 1, ensuring no other values.
        path_index[i] * (1 - path_index[i]) === 0;

        // Configure the multiplexer based on the path index for the current level.
        var c[2][2] = [
            [levelHashes[i], path_elements[i][0]],
            [path_elements[i][0], levelHashes[i]]
        ];

        var mux[2] = MultiMux1(2)(
            c,
            path_index[i]
        );

        var computedLevelHash = PoseidonHasher(2)([mux[0], mux[1]]);

        // Store the resulting hash as the next level's hash.
        levelHashes[i + 1] <== computedLevelHash;
    }

    // Set the final level hash as the root.
    root <== levelHashes[n_levels];
} 