include "../node_modules/circomlib/circuits/mimc.circom";
include "../node_modules/circomlib/circuits/escalarmulany.circom";


template Decrypt(N) {
    // Where N is the length of the
    // decrypted message
    signal input message[N+1];
    signal input privKey;
    signal output out[N];

    component hasher[N];

    // iv is message[0]
    for(var i=0; i<N; i++) {
        hasher[i] = MiMC7(91);
        hasher[i].x_in <== privKey;
        hasher[i].k <== message[0] + i;
        out[i] <== message[i+1] - hasher[i].out;
    }
}
