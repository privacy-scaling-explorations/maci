pragma circom 2.0.0;

// circomlib imports
include "./bitify.circom";
include "./escalarmulfix.circom";

// convert a private key to a public key
// @note the basepoint is the base point of the baby jubjub curve
template PrivToPubKey() {
    // Needs to be hashed, and then pruned before supplying it to the circuit
    signal input privKey;
    signal output pubKey[2];

    // convert the private key to bits
    component privBits = Num2Bits(253);
    privBits.in <== privKey;

    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    // perform scalar multiplication with the basepoint
    component mulFix = EscalarMulFix(253, BASE8);
    for (var i = 0; i < 253; i++) {
        mulFix.e[i] <== privBits.out[i];
    }

    pubKey[0] <== mulFix.out[0];
    pubKey[1] <== mulFix.out[1];
}
