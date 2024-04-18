pragma circom 2.0.0;

// circomlib imports
include "./compconstant.circom";
include "./comparators.circom";
include "./pointbits.circom";
include "./bitify.circom";
include "./escalarmulany.circom";
include "./escalarmulfix.circom";

// local imports
include "./hashers.circom";

/**
 * Variant of the EdDSAPoseidonVerifier template from circomlib
 * https://github.com/iden3/circomlib/blob/master/circuits/eddsa.circom
 */
template EdDSAPoseidonVerifier_patched() {
    // The x and y coordinates of the public key.
    signal input Ax;
    signal input Ay;
    // Signature scalar.
    signal input S;
    // The x and y coordinates of the signature point.
    signal input R8x;
    signal input R8y;
    // Message hash.
    signal input M;

    signal output valid;

    // Ensure S<Subgroup Order.
    // convert the signature scalar S into its binary representation.
    var snum2bits[254] = Num2Bits(254)(S);

    var compConstantIn[254];
    for (var i=0; i<253; i++) {
        compConstantIn[i] = snum2bits[i];
    }
    compConstantIn[253] = 0;

    // A component that ensures S is within a valid range, 
    // comparing it against a constant representing the subgroup order.
    var compConstant = CompConstant(2736030358979909402780800718157159386076813972158567259200215660948447373040)(compConstantIn);

    // Calculate the h = H(R,A, msg).
    var h2bits[254] = Num2Bits_strict()(PoseidonHasher(5)([R8x, R8y, Ax, Ay, M]));

    // These components perform point doubling operations on the public key
    // to align it within the correct subgroup as part of the verification process.
    var (dbl1XOut, dbl1YOut) = BabyDbl()(Ax, Ay);
    var (dbl2XOut, dbl2YOut) = BabyDbl()(dbl1XOut, dbl1YOut);
    var (dbl3XOut, dbl3YOut) = BabyDbl()(dbl2XOut, dbl2YOut);

    // A component that performs scalar multiplication of the 
    // adjusted public key by the hash output, essential for the verification calculation.
    var mulAny[2] = EscalarMulAny(254)(h2bits, [dbl3XOut, dbl3YOut]);

    // Compute the right side: right =  R8 + right2.
    var (addRightXOut, addRightYOut) = BabyAdd()(R8x, R8y, mulAny[0], mulAny[1]);

    // Calculate left side of equation left = S*B8.
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];
    
    // Fixed-base scalar multiplication of a base point by S.
    var mulFix[2] = EscalarMulFix(254, BASE8)(snum2bits);

    // Components to check the equality of x and y coordinates 
    // between the computed and expected points of the signature.
    var rightValid = IsEqual()([mulFix[0], addRightXOut]);
    var leftValid = IsEqual()([mulFix[1], addRightYOut]);
    var leftRightValid = IsEqual()([rightValid + leftValid, 2]);

    // Components to handle edge cases and ensure that all conditions 
    // for a valid signature are met, including the 
    // public key not being zero and other integrity checks.
    var isZero = IsZero()(Ax);
    var iz = IsEqual()([isZero, 0]);
    var isCcZero = IsZero()(compConstant);
    var isValid = IsEqual()([leftRightValid + iz + isCcZero, 3]);

    valid <== isValid;
}

/**
 * Verifies the EdDSA signature for a given command, which has exactly four elements in the hash preimage.
 */
template VerifySignature() {
    // Public key of the signer, consisting of two coordinates [x, y].
    signal input pubKey[2];
    // R8 point from the signature, consisting of two coordinates [x, y]. 
    signal input R8[2];
    // Scalar component of the signature.
    signal input S;

    // Number of elements in the hash preimage.
    var k = 4;
    
    // The preimage data that was hashed, an array of four elements.
    signal input preimage[k];

    signal output valid;

    // Hash the preimage using the Poseidon hashing function configured for four inputs.
    var M = PoseidonHasher(4)(preimage);

    // Instantiate the patched EdDSA Poseidon verifier with the necessary inputs.
    var verifier = EdDSAPoseidonVerifier_patched()(
        pubKey[0],
        pubKey[1],
        S,
        R8[0],
        R8[1],
        M
    );

    valid <== verifier;
}
