// ElGamal Decryption
include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template ElGamalDecrypt() {
    // Masking key
    signal input kG[2];

    // Encrypted message
    signal input Me[2];

    // Private key
    signal private input sk;

    // Decrypted message
    signal output m;

    // kG * sk
    component mulkGSk = EscalarMulAny(253);
    for (var i = 0; i < 253; i ++) {
        mulkGSk.e[i] <== sk.out[i];
    }
    mulkGSk.p[0] <== kG[0];
    mulkGSk.p[1] <== kG[1];

    // Inverse y coordinate for point km * sk 
    signal yInv;
    kMsKInv <== 0 - kMsKInv[1];

    // Decrypts message point
    // M = Me * kGSk^-1
    component M = BabyAdd();
    M.x1 <== kGSk.out[0];
    M.y1 <== yInv;
    M.x2 <== Me[0];
    M.y2 <== Me[1];

    m <== M.xout;
}