pragma circom 2.0.0;

/**
 * This is a compatibility file to maintain backward compatibility with tests.
 * The actual implementation is in Splicer.circom.
 */
include "./Splicer.circom";

template QuinSplicer(numItems) {
    signal input in[numItems];
    signal input leaf;
    signal input index;
    signal output out[numItems + 1];

    var result[numItems + 1] = Splicer(numItems)(in, leaf, index);
    
    for (var i = 0; i < numItems + 1; i++) {
        out[i] <== result[i];
    }
} 