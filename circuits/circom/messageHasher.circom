pragma circom 2.0.0;

// local import
include "./hasherPoseidon.circom";

// hash a MACI message together with the public key
// used to encrypt the message
template MessageHasher() {
    // 11 inputs are the MACI message
    signal input in[11];
    // the public key used to encrypt the message
    signal input encPubKey[2];
    // we output an hash 
    signal output hash;

    component hasher = Hasher13();

    // we add all parts of the msg
    for (var i = 0; i < 11; i ++) {
        hasher.in[i] <== in[i];
    }
    hasher.in[11] <== encPubKey[0];
    hasher.in[12] <== encPubKey[1];

    hash <== hasher.hash;
}
