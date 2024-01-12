pragma circom 2.0.0;

// https://github.com/weijiekoh/circomlib/blob/feat/poseidon-encryption/circuits/poseidon.circom
include "./poseidon-cipher.circom";

template Poseidon_OLD(nInputs) {
    signal input inputs[nInputs];
    signal output out;

    component strategy = PoseidonPerm(nInputs + 1);
    strategy.inputs[0] <== 0;
    for (var i = 0; i < nInputs; i++) {
        strategy.inputs[i + 1] <== inputs[i];
    }
    out <== strategy.out[0];
}
