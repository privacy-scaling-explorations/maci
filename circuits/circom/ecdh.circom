pragma circom 2.0.0;

// circomlib imports
include "./bitify.circom";
include "./escalarmulany.circom";

template Ecdh() {
    // Note: the private key needs to be hashed and pruned first
    signal input privKey;
    signal input pubKey[2];
    signal output sharedKey[2];

    component privBits = Num2Bits(253);
    privBits.in <== privKey;

    component mulFix = EscalarMulAny(253);
    mulFix.p[0] <== pubKey[0];
    mulFix.p[1] <== pubKey[1];

    for (var i = 0; i < 253; i++) {
        mulFix.e[i] <== privBits.out[i];
    }

    sharedKey[0] <== mulFix.out[0];
    sharedKey[1] <== mulFix.out[1];
}
