pragma circom 2.0.0;

// zk-kit imports
include "./poseidon-cipher.circom";

// circomlib import
include "./sha256/sha256.circom"; 
include "./bitify.circom";

/**
 * Computes the SHA-256 hash of an array of input signals. Each input is first
 * converted to a 256-bit representation, then these are concatenated and passed
 * to the SHA-256 hash function. The output is the 256 hash value of the inputs bits
 * converted back to numbers.
 */
template Sha256Hasher(length) {
    var inBits = 256 * length;

    signal input in[length];
    signal output hash;

    component n2b[length];
    for (var i = 0; i < length; i++) {
        n2b[i] = Num2Bits(256);
        n2b[i].in <== in[i];
    }

    component sha = Sha256(inBits);
    for (var i = 0; i < length; i++) {
        for (var j = 0; j < 256; j++) {
            sha.in[(i * 256) + 255 - j] <== n2b[i].out[j];
        }
    }

    component shaOut = Bits2Num(256);
    for (var i = 0; i < 256; i++) {
        shaOut.in[i] <== sha.out[255-i];
    }

    hash <== shaOut.out;
}

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
    var extendedInputs[n + 1];
    extendedInputs[0] = 0;

    for (var i = 0; i < n; i++) {
        extendedInputs[i + 1] = inputs[i];
    }

    // Compute the Poseidon hash of the extended inputs.
    var perm[n + 1]; 
    perm = PoseidonPerm(n + 1)(extendedInputs);

    out <== perm[0];
}

/**
 * Hashes a MACI message and the public key used for message encryption. 
 * This template processes 11 message inputs and a 2-element public key
 * combining them using the Poseidon hash function. The hashing process involves two stages: 
 * 1. hashing message parts in groups of five and,
 * 2. hashing the grouped results alongside the first message input and 
 * the encryption public key to produce a final hash output. 
 */
template MessageHasher() {
    // 11 inputs are the MACI message.
    signal input in[11];
    // the public key used to encrypt the message.
    signal input encPubKey[2];
    // we output an hash.
    signal output hash;

    // Hasher5(
    //     in[0]
    //     Hasher5_1(in[1], in[2], in[3], in[4], in[5]),
    //     Hasher5_2(in[6], in[7], in[8], in[9], in[10])
    //     in[11],
    //     in[12]
    // )

    var hasher5_1;
    hasher5_1 = PoseidonHasher(5)([
        in[1],
        in[2],
        in[3],
        in[4],
        in[5]
    ]);

    var hasher5_2;
    hasher5_2 = PoseidonHasher(5)([
        in[6],        
        in[7],
        in[8],
        in[9],
        in[10]
    ]);

    hash <== PoseidonHasher(5)([
        in[0],
        hasher5_1,
        hasher5_2,
        encPubKey[0],
        encPubKey[1]        
    ]);
}
