pragma circom 2.0.0;
// ElGamal Decryption
include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

// (0,1) --> 0; BASE point --> 1
template PointToBit() {
    signal input M[2];
    signal output bit;
    bit <== M[0] / 5299619240641551281634865583518297030282874472190772894086521144482721001553;
}

template ElGamalDecryptBit() {
    // Masking key
    signal input kG[2];

    // Encrypted point
    signal input Me[2];

    // Decrypted bit
    signal output m;

    // Private key
    signal input sk;

    component elGamalDec = ElGamalDecryptPoint();
    elGamalDec.kG[0] <== kG[0];
    elGamalDec.kG[1] <== kG[1];

    elGamalDec.Me[0] <== Me[0];
    elGamalDec.Me[1] <== Me[1];

    elGamalDec.sk <== sk;

    component pointToBit = PointToBit();
    pointToBit.M[0] <== elGamalDec.M[0];
    pointToBit.M[1] <== elGamalDec.M[1];

    // Select output bit
    m <== pointToBit.bit;
}

template ElGamalDecryptPoint() {
    // Masking key
    signal input kG[2];

    // Encrypted point
    signal input Me[2];

    // Private key
    signal input sk;

    // Decrypted point
    signal output M[2];


    // Bits of the sk
    component skBits = Num2Bits(254);
    skBits.in <== sk;

    // kG * sk
    component mulkGSk = EscalarMulAny(254);
    for (var i = 0; i < 254; i ++) {
        mulkGSk.e[i] <== skBits.out[i];
    }
    mulkGSk.p[0] <== kG[0];
    mulkGSk.p[1] <== kG[1];

    // Inverse y coordinate for point km * sk 
    signal xInv;
    xInv <== 0 - mulkGSk.out[0];

    // Decrypts message point
    // M = Me * kGSk^-1
    component Md = BabyAdd();
    Md.x1 <== xInv;
    Md.y1 <== mulkGSk.out[1];
    Md.x2 <== Me[0];
    Md.y2 <== Me[1];

    M[0] <== Md.xout;
    M[1] <== Md.yout;
}