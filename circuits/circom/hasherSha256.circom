pragma circom 2.0.0;

// circomlib imports
include "./sha256/sha256.circom"; 
include "./bitify.circom"; 

template Sha256HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = Sha256Hasher(2);
    hasher.in[0] <== left;
    hasher.in[1] <== right;
    hash <== hasher.hash;
}

template Sha256Hasher3() {
    var length = 3;
    var inBits = 256 * length;

    signal input in[length];
    signal output hash;

    component hasher = Sha256Hasher(length);
    for (var i = 0; i < length; i ++) {
        hasher.in[i] <== in[i];
    }
    hash <== hasher.hash;
}

template Sha256Hasher4() {
    var length = 4;
    var inBits = 256 * length;

    signal input in[length];
    signal output hash;

    component hasher = Sha256Hasher(length);
    for (var i = 0; i < length; i ++) {
        hasher.in[i] <== in[i];
    }
    hash <== hasher.hash;
}

template Sha256Hasher5() {
    var length = 5;
    var inBits = 256 * length;

    signal input in[length];
    signal output hash;

    component hasher = Sha256Hasher(length);
    for (var i = 0; i < length; i ++) {
        hasher.in[i] <== in[i];
    }
    hash <== hasher.hash;
}

template Sha256Hasher6() {
    var length = 6;
    var inBits = 256 * length;

    signal input in[length];
    signal output hash;

    component hasher = Sha256Hasher(length);
    for (var i = 0; i < length; i ++) {
        hasher.in[i] <== in[i];
    }
    hash <== hasher.hash;
}

template Sha256Hasher10() {
    var length = 10;
    var inBits = 256 * length;

    signal input in[length];
    signal output hash;

    component hasher = Sha256Hasher(length);
    for (var i = 0; i < length; i ++) {
        hasher.in[i] <== in[i];
    }
    hash <== hasher.hash;
}

template Sha256Hasher(length) {
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
