include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/escalarmulany.circom";


// TODO: Check if public key is on the curve?
template Ecdh() {
    // Note: private key
    // Needs to be hashed, and then pruned before
    // supplying it to the circuit
    signal private input privKey;
    signal input pubKey[2];

    signal output sharedKey;

    component privBits = Num2Bits(253);
    privBits.in <== privKey;

    component mulFix = EscalarMulAny(253);
    mulFix.p[0] <== pubKey[0];
    mulFix.p[1] <== pubKey[1];

    for (var i = 0; i < 253; i++) {
        mulFix.e[i] <== privBits.out[i];
    }

    sharedKey <== mulFix.out[0];
}
