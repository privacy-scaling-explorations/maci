pragma circom 2.0.0;

// https://github.com/weijiekoh/circomlib/blob/feat/poseidon-encryption/circuits/poseidon.circom
include "./poseidon-cipher.circom";
include "./sha256/sha256.circom"; 
include "./bitify.circom";

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

// Template for computing the Poseidon hash of an array of 'n' inputs 
// with a default zero state (not included in the 'n' inputs).
template PoseidonHasher(n) {
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

// hash a MACI message together with the public key
// used to encrypt the message
template MessageHasher() {
    // 11 inputs are the MACI message
    signal input in[11];
    // the public key used to encrypt the message
    signal input encPubKey[2];
    // we output an hash 
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
