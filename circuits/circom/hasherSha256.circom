include "../node_modules/circomlib/circuits/sha256/sha256.circom"; 
include "../node_modules/circomlib/circuits/bitify.circom"; 

template Sha256HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component leftBits = Num2Bits(256);
    leftBits.in <== left;

    component rightBits = Num2Bits(256);
    rightBits.in <== right;

    var inBits = 256 * 2;

    component sha = Sha256(inBits);
    for (var i = 0; i < 256; i ++) {
        sha.in[255 - i] <== leftBits.out[i];
        sha.in[256 + 255 - i] <== rightBits.out[i];
    }

    component shaOut = Bits2Num(256);
    for (var i = 0; i < 256; i++) {
        shaOut.in[i] <== sha.out[255-i];
    }
    hash <== shaOut.out;
}

template Sha256Hasher5() {
    var length = 5;
    var inBits = 256 * length;

    signal input in[length];
    signal output hash;

    component n2b[length];
    for (var i = 0; i < length; i++) {
        n2b[i] = Num2Bits(256);
        n2b[i].in <== in[i];
    }

    component sha = Sha256(inBits);
    for (var i = 0; i < length; i ++) {
        for (var j = 0; j < 256; j ++) {
            sha.in[(i * 256) + 255 - j] <== n2b[i].out[j];
        }
    }

    component shaOut = Bits2Num(256);
    for (var i = 0; i < 256; i++) {
        shaOut.in[i] <== sha.out[255-i];
    }
    hash <== shaOut.out;
}
