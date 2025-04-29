pragma circom 2.0.0;

// circomlib imports
include "./bitify.circom";
include "./comparators.circom";
include "./escalarmulfix.circom";

/**
 * Converts a private key to a public key on the BabyJubJub curve.
 * The input private key needs to be hashed and then pruned before.
 */
template PrivateToPublicKey() {
    // The base point of the BabyJubJub curve.
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    // The prime subgroup order.
    var SUBGROUP_ORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041;

    // The private key
    signal input privateKey;
    // The public key
    signal output publicKey[2];

    // Check if private key is in the prime subgroup order
    var isLessThan = LessThan(251)([privateKey, SUBGROUP_ORDER]);
    isLessThan === 1;

    // Convert the private key to bits.
    var computedPrivateBits[253] = Num2Bits(253)(privateKey);

    // Perform scalar multiplication with the basepoint.
    var computedPublicKey[2] = EscalarMulFix(253, BASE8)(computedPrivateBits);

    publicKey <== computedPublicKey;
}
