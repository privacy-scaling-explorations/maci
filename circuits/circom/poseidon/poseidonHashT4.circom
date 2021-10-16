pragma circom 2.0.0;
include "../../node_modules/circomlib/circuits/poseidon.circom";

template PoseidonHashT4() {
    var nInputs = 3;
    signal input inputs[nInputs];
    signal output out;

    component hasher = Poseidon(nInputs);
    for (var i = 0; i < nInputs; i ++) {
        hasher.inputs[i] <== inputs[i];
    }
    out <== hasher.out;
}
