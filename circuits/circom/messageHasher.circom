pragma circom 2.0.0;
include "./hasherPoseidon.circom";

template MessageHasher() {
    signal input in[11];
    signal input encPubKey[2];
    signal output hash;

    component hasher = Hasher13();

    for (var i = 0; i < 11; i ++) {
        hasher.in[i] <== in[i];
    }
    hasher.in[11] <== encPubKey[0];
    hasher.in[12] <== encPubKey[1];

    hash <== hasher.hash;
}
