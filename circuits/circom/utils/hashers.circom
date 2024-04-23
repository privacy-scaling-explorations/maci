pragma circom 2.0.0;

// circomlib import
include "./sha256/sha256.circom"; 
include "./bitify.circom";
// zk-kit imports
include "./poseidon-cipher.circom";

/**
 * Computes the SHA-256 hash of an array of input signals. Each input is first
 * converted to a 256-bit representation, then these are concatenated and passed
 * to the SHA-256 hash function. The output is the 256 hash value of the inputs bits
 * converted back to numbers.
 */
template Sha256Hasher(length) {
    var SHA_LENGTH = 256;
    var inBits = SHA_LENGTH * length;

    signal input in[length];
    signal output hash;

    // Array to store all bits of inputs for SHA-256 input.
    var computedBits[inBits];

    // Convert each input into bits and store them in the `bits` array.
    for (var i = 0; i < length; i++) {
        var computedBitsInput[SHA_LENGTH] = Num2Bits(SHA_LENGTH)(in[i]);
        for (var j = 0; j < SHA_LENGTH; j++) {
            computedBits[(i * SHA_LENGTH) + (SHA_LENGTH - 1) - j] = computedBitsInput[j];
        }
    }

    // SHA-256 hash computation.
    var computedSha256Bits[SHA_LENGTH] = Sha256(inBits)(computedBits);

    // Convert SHA-256 output back to number.
    var computedBitsToNumInput[SHA_LENGTH];
    for (var i = 0; i < SHA_LENGTH; i++) {
        computedBitsToNumInput[i] = computedSha256Bits[(SHA_LENGTH - 1) - i];
    }
    var computedSha256Number = Bits2Num(256)(computedBitsToNumInput); 

    hash <== computedSha256Number;
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

    var computedHasher5_1;
    computedHasher5_1 = PoseidonHasher(5)([
        in[1],
        in[2],
        in[3],
        in[4],
        in[5]
    ]);

    var computedHasher5_2;
    computedHasher5_2 = PoseidonHasher(5)([
        in[6],        
        in[7],
        in[8],
        in[9],
        in[10]
    ]);

    hash <== PoseidonHasher(5)([
        in[0],
        computedHasher5_1,
        computedHasher5_2,
        encPubKey[0],
        encPubKey[1]        
    ]);
}
