pragma circom 2.0.0;

// circomlib import
include "./bitify.circom";

// Converts a field element (253 bits) to n 50-bit output elements 
// where n <= 5 and n > 1
template UnpackElement(n) {
    signal input in;
    signal output out[n];
    assert(n > 1);
    assert(n <= 5);

    // Convert input to bits
    component inputBits = Num2Bits_strict();
    inputBits.in <== in;

    component outputElements[n];
    for (var i = 0; i < n; i++) {
        outputElements[i] = Bits2Num(50);
        for (var j = 0; j < 50; j++) {
            outputElements[i].in[j] <== inputBits.out[((n - i - 1) * 50) + j];
        }
        out[i] <== outputElements[i].out;
    }
}
