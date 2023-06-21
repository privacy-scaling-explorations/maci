pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * Converts a field element (253 bits) to n 50-bit output elements where n <= 5
 * and n > 1
 */
template UnpackElement(n) {
    signal input in;
    signal output out[n];
    assert(n > 1);
    assert(n <= 5);

    // Convert input to bits
    component inputBits = Num2Bits_strict();
    inputBits.in <== in;

    component outputElements[n];
    for (var i = 0; i < n; i ++) {
        outputElements[i] = Bits2Num(50);
        for (var j = 0; j < 50; j ++) {
            outputElements[i].in[j] <== inputBits.out[((n - i - 1) * 50) + j];
        }
        out[i] <== outputElements[i].out;
    }
}


/*
 * calculate the next batch index and the corresponding packedVal
 * n is fixed to be 4
 */
template PackNextBatch(batchSize) {
    // in = [batchEndIndex, batchStartIndex, numSignUps, maxVoteOptions]
    signal input in[4];
    signal output out;
    signal next[4];

    next[3] <== in[3];
    next[2] <== in[2];

    component iz = IsZero();
    iz.in <== in[1];
    next[1] <== (1-iz.out) * (in[1] - batchSize);
    next[0] <== next[1] + batchSize;

    component inputBits[4];
    component outBits = Bits2Num(4*50);
    for (var i = 0; i < 4; i ++) {
        inputBits[i] = Num2Bits(50);
        inputBits[i].in <== next[i];
        for (var j = 0; j < 50; j ++) {
            outBits.in[((4-i-1)*50)+j] <== inputBits[i].out[j];
        }
    }
    out <== outBits.out;
}
