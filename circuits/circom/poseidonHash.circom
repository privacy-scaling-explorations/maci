pragma circom 2.0.0;

// https://github.com/weijiekoh/circomlib/blob/feat/poseidon-encryption/circuits/poseidon.circom
include "./poseidon-cipher.circom";

// Template for computing the Poseidon hash of an array of 'n' inputs 
// with a default zero state (not included in the 'n' inputs).
template PoseidonHash(n) {
    signal input inputs[n];
    signal output out;

    var extendedInputs[n + 1]; // [0, inputs].
    extendedInputs[0] = 0;

    for (var i = 0; i < n; i++) {
        extendedInputs[i + 1] = inputs[i];
    }

    // Compute the Poseidon hash of the extended inputs.
    var perm[n + 1]; 
    perm = PoseidonPerm(n + 1)(extendedInputs);

    out <== perm[0];
}
