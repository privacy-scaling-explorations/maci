pragma circom 2.0.0;

// circomlib imports
include "./bitify.circom";
include "./comparators.circom";
include "./mux1.circom";

template msb(n) {
    // require in < 2**n 
    signal input in;
    signal output out;
    component n2b = Num2Bits(n);
    n2b.in <== in;
    n2b.out[n-1] ==> out;
}

template shift(n) {
    // shift divident and partial rem together 
    // divident will reduce by 1 bit each call
    // require divident < 2**n
    signal input divident;
    signal input rem;
    signal output divident1;
    signal output rem1;
    
    component lmsb = msb(n);
    lmsb.in <== divident;
    rem1 <== rem * 2 + lmsb.out;
    divident1 <== divident - lmsb.out * 2**(n-1);
}

template IntegerDivision(n) {
    signal input a;
    signal input b;
    signal output c;

    component lta = LessThan(252);
    lta.in[0] <== a;
    lta.in[1] <== 2**n;
    lta.out === 1;
    component ltb = LessThan(252);
    ltb.in[0] <== b;
    ltb.in[1] <== 2**n;
    ltb.out === 1;

    component isz = IsZero();
    isz.in <== b;
    isz.out === 0;

    var divident = a;
    var rem = 0;

    component b2n = Bits2Num(n);
    component shf[n];
    component lt[n];
    component mux[n];

    for (var i = n - 1; i >= 0; i--) {
        shf[i] = shift(i+1);
        lt[i] = LessEqThan(n);
        mux[i] = Mux1();
    }

    for (var i = n-1; i >= 0; i--) {
        shf[i].divident <==  divident;
        shf[i].rem <== rem;
        divident = shf[i].divident1;
        rem = shf[i].rem1;

        lt[i].in[0] <== b; 
        lt[i].in[1] <== rem;

        mux[i].s <== lt[i].out;
        mux[i].c[0] <== 0;
        mux[i].c[1] <== 1;
        mux[i].out ==> b2n.in[i];

        rem = rem - b * lt[i].out;
    }
    b2n.out ==> c;
}

template ToFloat(W) {
    // W is the number of digits in decimal part
    // 10^75 < 2^252
    assert(W < 75);

    // in*10^W <= 10^75
    signal input in;
    signal output out;
    component lt = LessEqThan(252);
    lt.in[0] <== in;
    lt.in[1] <== 10**(75-W);
    lt.out === 1;
    out <== in * (10**W);
}

template DivisionFromFloat(W, n) {
    // W is the number of digits in decimal part
    // n is maximum width of a and b in binary form
    // assume a, b are both float representation
    signal input a;
    signal input b;
    signal output c;

    assert(W < 75);
    assert(n < 252);

    component lt = LessThan(252);
    lt.in[0] <== a; 
    lt.in[1] <== 10 ** (75 - W);
    lt.out === 1;

    component div = IntegerDivision(n);
    div.a <== a * (10 ** W);
    div.b <== b;
    c <== div.c;
}

template DivisionFromNormal(W, n) {
    // W is the number of digits in decimal part
    // n is maximum width of integer part of a and b in binary form
    // assume a, b are both normal representation
    signal input a;
    signal input b;
    signal output c;
    component tfa = ToFloat(W);
    component tfb = ToFloat(W);
    component div = DivisionFromFloat(W, n);
    tfa.in <== a;
    tfb.in <== b;
    div.a <== tfa.out;
    div.b <== tfb.out;
    c <== div.c;
}

template MultiplicationFromFloat(W, n) {
    // W is the number of digits in decimal part
    // n is maximum width of integer part of a and b in binary form
    // assume a, b are both float representation
    signal input a;
    signal input b;
    signal output c;

    assert(W < 75);
    assert(n < 252);
    assert(10**W < 2**n);

    component div = IntegerDivision(n);

    // not the best way, but works in our case
    component lta = LessThan(252);
    lta.in[0] <== a; 
    lta.in[1] <== 2 ** 126;
    lta.out === 1;
    component ltb = LessThan(252);
    ltb.in[0] <== b; 
    ltb.in[1] <== 2 ** 126;
    ltb.out === 1;

    div.a <== a * b;
    div.b <== 10**W;
    c <== div.c;
}

template MultiplicationFromNormal(W, n) {
    // W is the number of digits in decimal part
    // n is maximum width of integer part of a and b in binary form
    // assume a, b are both float representation
    signal input a;
    signal input b;
    signal output c;
    component tfa = ToFloat(W);
    component tfb = ToFloat(W);
    component mul = MultiplicationFromFloat(W, n);
    tfa.in <== a;
    tfb.in <== b;
    mul.a <== tfa.out;
    mul.b <== tfb.out;
    c <== mul.c;
}
