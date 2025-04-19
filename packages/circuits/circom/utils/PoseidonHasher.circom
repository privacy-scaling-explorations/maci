pragma circom 2.0.0;

// zk-kit imports
include "./poseidon-cipher.circom";

/**
 * Computes the Poseidon hash for an array of n inputs, including a default initial state 
 * of zero not counted in n. First, extends the inputs by prepending a zero, creating an array [0, inputs]. 
 * Then, the Poseidon hash of the extended inputs is calculated, with the first element of the 
 * result assigned as the output. 
 */
template PoseidonHasher(n) {
    signal input inputs[n];
    signal output out;

    // [0, inputs].
    var computedExtendedInputs[n + 1];
    computedExtendedInputs[0] = 0;

    for (var i = 0; i < n; i++) {
        computedExtendedInputs[i + 1] = inputs[i];
    }

    // Compute the Poseidon hash of the extended inputs.
    var computedPoseidonPerm[n + 1]; 
    computedPoseidonPerm = PoseidonPerm(n + 1)(computedExtendedInputs);

    out <== computedPoseidonPerm[0];
}
