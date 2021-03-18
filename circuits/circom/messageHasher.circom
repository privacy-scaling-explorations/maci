include "./hasherSha256.circom";
include "./hasherPoseidon.circom";

template MessageHasher() {
    signal input in[8];
    signal input encPubKey[2];
    signal output hash;

    component hasher = Sha256Hasher10();

    for (var i = 0; i < 8; i ++) {
        hasher.in[i] <== in[i];
    }
    hasher.in[8] <== encPubKey[0];
    hasher.in[9] <== encPubKey[1];

    hash <== hasher.hash;
}
