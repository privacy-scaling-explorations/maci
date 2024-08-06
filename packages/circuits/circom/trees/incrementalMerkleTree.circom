pragma circom 2.0.0;

// circomlib import
include "./mux1.circom";
include "./comparators.circom";
// local import
include "../utils/hashers.circom";
include "../utils/calculateTotal.circom";

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

/**
 * Ensures that a leaf exists within a Merkle tree with a given root.
 */
template LeafExists(levels){
  // The leaf whose existence within the tree is being verified.
  signal input leaf;

  // The elements along the path needed for the inclusion proof.
  signal input path_elements[levels][1];
  // The indices indicating the path taken through the tree for the leaf.
  signal input path_index[levels];
  // The root of the Merkle tree, against which the inclusion is verified.
  signal input root;

  var computedMerkleRoot = MerkleTreeInclusionProof(levels)(
    leaf,
    path_index,
    path_elements
  );

  root === computedMerkleRoot;
}

/**
 * Verifies the correct construction of a Merkle tree from a set of leaves.
 * Given a Merkle root and a list of leaves, check if the root is the
 * correct result of inserting all the leaves into the tree (in the given order).
 */
template CheckRoot(levels) {
    // The total number of leaves in the Merkle tree, calculated as 2 to the power of `levels`.
    var totalLeaves = 2 ** levels;
    // The number of first-level hashers needed, equal to half the total leaves, as each hasher combines two leaves.
    var numLeafHashers = totalLeaves / 2;
    // The number of intermediate hashers, one less than the number of leaf hashers, 
    // as each level of hashing reduces the number of hash elements by about half.
    var numIntermediateHashers = numLeafHashers - 1;
    
    // Array of leaf values input to the circuit.
    signal input leaves[totalLeaves];

    // Output signal for the Merkle root that results from hashing all the input leaves.
    signal output root;

    // Total number of hashers used in constructing the tree, one less than the total number of leaves,
    // since each level of the tree combines two elements into one.
    var numHashers = totalLeaves - 1;
    var computedLevelHashers[numHashers];

    // Initialize hashers for the leaves, each taking two adjacent leaves as inputs.
    for (var i = 0; i < numLeafHashers; i++){
        computedLevelHashers[i] = PoseidonHasher(2)([leaves[i*2], leaves[i*2+1]]);
    }

    // Initialize hashers for intermediate levels, each taking the outputs of two hashers from the previous level.
    var k = 0;
    for (var i = numLeafHashers; i < numLeafHashers + numIntermediateHashers; i++) {
        computedLevelHashers[i] = PoseidonHasher(2)([computedLevelHashers[k*2], computedLevelHashers[k*2+1]]);
        k++;
    }

    // Connect the output of the final hasher in the array to the root output signal.
    root <== computedLevelHashers[numHashers-1];
}

/**
 * Calculates the path indices required for Merkle proof verifications. 
 * Given a node index within an IMT and the total tree levels, it outputs the path indices leading to that node.
 * The template handles the modulo and division operations to break down the tree index into its constituent path indices.
 */
template MerkleGeneratePathIndices(levels) {
    var BASE = 2;

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

// @note taken from @zk-kit/circuits
// if used directly in processMessages circom complains about duplicated
// templates (Ark, Poseidon, etc.)
// This circuit is designed to calculate the root of a binary Merkle
// tree given a leaf, its depth, and the necessary sibling
// information (aka proof of membership).
// A circuit is designed without the capability to iterate through
// a dynamic array. To address this, a parameter with the static maximum
// tree depth is defined (i.e. 'MAX_DEPTH'). And additionally, the circuit
// receives a dynamic depth as an input, which is utilized in calculating the
// true root of the Merkle tree. The actual depth of the Merkle tree
// may be equal to or less than the static maximum depth.
// NOTE: This circuit will successfully verify `out = 0` for `depth > MAX_DEPTH`.
// Make sure to enforce `depth <= MAX_DEPTH` outside the circuit.
template BinaryMerkleRoot(MAX_DEPTH) {
    signal input leaf, depth, indices[MAX_DEPTH], siblings[MAX_DEPTH][1];

    signal output out;

    signal nodes[MAX_DEPTH + 1];
    nodes[0] <== leaf;

    signal roots[MAX_DEPTH];
    var root = 0;

    for (var i = 0; i < MAX_DEPTH; i++) {
        var isDepth = IsEqual()([depth, i]);

        roots[i] <== isDepth * nodes[i];

        root += roots[i];

        var c[2][2] = [
            [nodes[i], siblings[i][0]],
            [siblings[i][0], nodes[i]]
        ];
        
        var childNodes[2] = MultiMux1(2)(c, indices[i]);

        nodes[i + 1] <== PoseidonHasher(2)(childNodes);
    }

    var isDepth = IsEqual()([depth, MAX_DEPTH]);

    out <== root + isDepth * nodes[MAX_DEPTH];
}
