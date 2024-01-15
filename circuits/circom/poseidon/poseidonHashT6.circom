pragma circom 2.0.0;

include "./poseidon.circom";

template PoseidonHashT6() {
    var nInputs = 5;
    signal input inputs[nInputs];
    signal output out;

    component hasher = Poseidon_OLD(nInputs);
    for (var i = 0; i < nInputs; i ++) {
        hasher.inputs[i] <== inputs[i];
    }
    out <== hasher.out;
}
