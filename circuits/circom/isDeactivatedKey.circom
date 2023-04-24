pragma circom 2.0.0;
include "./trees/incrementalQuinTree.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./poseidon/poseidonHashT3.circom";

template IsDeactivatedKey(levels) {
    var LEAVES_PER_NODE = 5;
    var LEAVES_PER_PATH_LEVEL = LEAVES_PER_NODE - 1;

    signal input root;
    signal input key[2];
    signal input path_index[levels];
    signal input path_elements[levels][LEAVES_PER_PATH_LEVEL];
    signal output isDeactivated;
    signal output computedRoot;

    // Hash public key x and y coordinates
    signal keyHash;
    component keyHasher = PoseidonHashT3();
    keyHasher.inputs[0] <== key[0];
    keyHasher.inputs[1] <== key[1];

    keyHash <== keyHasher.out;

    // Compute root for the given proof params
    component incProof = QuinTreeInclusionProof(levels);
    incProof.leaf <== keyHash;

    for (var i = 0; i < levels; i++) {
        incProof.path_index[i] <== path_index[i];
    }

    for (var i = 0; i < levels; i++) {
        for (var j = 0; j < LEAVES_PER_PATH_LEVEL; j++) {
            incProof.path_elements[i][j] <== path_elements[i][j];
        }
    }

    // Compare if the root is equal to the claimed root
    component rootCompare = IsEqual();
    rootCompare.in[0] <== incProof.root;
    rootCompare.in[1] <== root;

    // If the root claims are equal, the key is found in the tree and deactivated
    isDeactivated <== rootCompare.out;
    computedRoot <== incProof.root;
}