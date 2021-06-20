include "./hasherPoseidon.circom";

template MessageHasher() {
    signal input in[10];
    signal input encPubKey[2];
    signal output hash;

    component hasher = Hasher12();

    for (var i = 0; i < 10; i ++) {
        hasher.in[i] <== in[i];
    }
    hasher.in[10] <== encPubKey[0];
    hasher.in[11] <== encPubKey[1];

    hash <== hasher.hash;
}
