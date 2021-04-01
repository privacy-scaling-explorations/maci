include "./poseidon/poseidonHashT3.circom"
include "./poseidon/poseidonHashT4.circom"
include "./poseidon/poseidonHashT5.circom"
include "./poseidon/poseidonHashT6.circom"

template Hasher3() {
    var length = 3;
    signal input in[length];
    signal output hash;

    component hasher = PoseidonHashT4();

    for (var i = 0; i < length; i++) {
        hasher.inputs[i] <== in[i];
    }

    hash <== hasher.out;
}

template Hasher4() {
    var length = 4;
    signal input in[length];
    signal output hash;

    component hasher = PoseidonHashT5();

    for (var i = 0; i < length; i++) {
        hasher.inputs[i] <== in[i];
    }

    hash <== hasher.out;
}

template Hasher5() {
    var length = 5;
    signal input in[length];
    signal output hash;

    component hasher = PoseidonHashT6();

    for (var i = 0; i < length; i++) {
        hasher.inputs[i] <== in[i];
    }

    hash <== hasher.out;
}

template Hasher10() {
    // Hasher2(
    //     Hasher5_1(in[0], in[1], in[2], in[3], in[4]),
    //     Hasher5_2(in[5], in[6], in[7], in[8], in[9])
    // )

    signal input in[10];
    signal output hash;

    component hasher2 = PoseidonHashT3();

    component hasher5_1 = PoseidonHashT6();
    component hasher5_2 = PoseidonHashT6();

    for (var i = 0; i < 5; i++) {
        hasher5_1.inputs[i] <== in[i];
        hasher5_2.inputs[i] <== in[i+5];
    }
    hasher2.inputs[0] <== hasher5_1.out;
    hasher2.inputs[1] <== hasher5_2.out;

    hash <== hasher2.out;
}

template HashLeftRight() {
    signal input left;
    signal input right;

    signal output hash;

    component hasher = PoseidonHashT3();
    left ==> hasher.inputs[0];
    right ==> hasher.inputs[1];

    hash <== hasher.out;
}
