include "../node_modules/circomlib/circuits/mimc.circom";
include "../node_modules/circomlib/circuits/escalarmulany.circom";

template Decrypt(length) {
    signal input message[length + 1];
    signal input privKey;
    signal output out[length];

    component hasher[length];

    // message[0] is the IV
    for(var i = 0; i < length; i ++) {
        hasher[i] = MiMC7(91);
        hasher[i].x_in <== privKey;
        hasher[i].k <== message[0] + i;
        out[i] <== message[i+1] - hasher[i].out;
    }
}
