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

/**
 * Hashes a MACI message and the public key used for message encryption. 
 * This template processes 10 message inputs and a 2-element public key
 * combining them using the Poseidon hash function. The hashing process involves two stages: 
 * 1. hashing message parts in groups of five and,
 * 2. hashing the grouped results alongside the first message input and 
 * the encryption public key to produce a final hash output. 
 */
template MessageHasher() {
    // The MACI message is composed of 10 parts.
    signal input in[10];
    // the public key used to encrypt the message.
    signal input encPubKey[2];
    // we output an hash.
    signal output hash;

    // Hasher4(
    //     Hasher5_1(in[1], in[2], in[3], in[4], in[5]),
    //     Hasher5_2(in[6], in[7], in[8], in[9], in[10])
    //     in[11],
    //     in[12]
    // )

    var computedHasher5_1;
    computedHasher5_1 = PoseidonHasher(5)([
        in[0],
        in[1],
        in[2],
        in[3],
        in[4]
    ]);

    var computedHasher5_2;
    computedHasher5_2 = PoseidonHasher(5)([
        in[5],        
        in[6],
        in[7],
        in[8],
        in[9]
    ]);

    hash <== PoseidonHasher(4)([
        computedHasher5_1,
        computedHasher5_2,
        encPubKey[0],
        encPubKey[1]        
    ]);
}
