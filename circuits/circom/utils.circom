pragma circom 2.0.0;

// circomlib import
include "./bitify.circom";

// the implicit assumption of LessThan is both inputs are at most n bits
// so we need add range check for both inputs
template SafeLessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component n2b1 = Num2Bits(n);
    n2b1.in <== in[0];
    component n2b2 = Num2Bits(n);
    n2b2.in <== in[1];

    component n2b = Num2Bits(n+1);

    n2b.in <== in[0] + (1<<n) - in[1];

    out <== 1-n2b.out[n];
}

// N is the number of bits the input have.
// The MSF is the sign bit.
template SafeLessEqThan(n) {
    signal input in[2];
    signal output out;

    component lt = SafeLessThan(n);

    lt.in[0] <== in[0];
    lt.in[1] <== in[1]+1;
    lt.out ==> out;
}

// N is the number of bits the input have.
// The MSF is the sign bit.
template SafeGreaterThan(n) {
    signal input in[2];
    signal output out;

    component lt = SafeLessThan(n);

    lt.in[0] <== in[1];
    lt.in[1] <== in[0];
    lt.out ==> out;
}

// N is the number of bits the input have.
// The MSF is the sign bit.
template SafeGreaterEqThan(n) {
    signal input in[2];
    signal output out;

    component lt = SafeLessThan(n);

    lt.in[0] <== in[1];
    lt.in[1] <== in[0]+1;
    lt.out ==> out;
}
