pragma circom 2.0.0;

// circomlib imports
include "./compconstant.circom";
include "./comparators.circom";
include "./pointbits.circom";
include "./bitify.circom";
include "./escalarmulany.circom";
include "./escalarmulfix.circom";

// local imports
include "./hasherPoseidon.circom";
include "./poseidon/poseidonHashT6.circom";

template EdDSAPoseidonVerifier_patched() {
    signal input Ax;
    signal input Ay;
    signal input S;
    signal input R8x;
    signal input R8y;
    signal input M;

    signal output valid;

    var i;

    // Ensure S<Subgroup Order
    component snum2bits = Num2Bits(254);
    snum2bits.in <== S;

    component compConstant = CompConstant(2736030358979909402780800718157159386076813972158567259200215660948447373040);

    for (i=0; i<253; i++) {
        snum2bits.out[i] ==> compConstant.in[i];
    }
    compConstant.in[253] <== 0;

    // Calculate the h = H(R,A, msg)
    component hash = PoseidonHashT6();
    hash.inputs[0] <== R8x;
    hash.inputs[1] <== R8y;
    hash.inputs[2] <== Ax;
    hash.inputs[3] <== Ay;
    hash.inputs[4] <== M;

    component h2bits = Num2Bits_strict();
    h2bits.in <==  hash.out;

    // Calculate second part of the right side:  right2 = h*8*A

    // Multiply by 8 by adding it 3 times. This also ensures that the result is
    // in the subgroup.
    component dbl1 = BabyDbl();
    dbl1.x <== Ax;
    dbl1.y <== Ay;
    component dbl2 = BabyDbl();
    dbl2.x <== dbl1.xout;
    dbl2.y <== dbl1.yout;
    component dbl3 = BabyDbl();
    dbl3.x <== dbl2.xout;
    dbl3.y <== dbl2.yout;

    component mulAny = EscalarMulAny(254);
    for (i=0; i<254; i++) {
        mulAny.e[i] <== h2bits.out[i];
    }
    mulAny.p[0] <== dbl3.xout;
    mulAny.p[1] <== dbl3.yout;


    // Compute the right side: right =  R8 + right2
    component addRight = BabyAdd();
    addRight.x1 <== R8x;
    addRight.y1 <== R8y;
    addRight.x2 <== mulAny.out[0];
    addRight.y2 <== mulAny.out[1];

    // Calculate left side of equation left = S*B8
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];
    component mulFix = EscalarMulFix(253, BASE8);
    for (i=0; i<253; i++) {
        mulFix.e[i] <== snum2bits.out[i];
    }

    // Valid should equal to 0 if its valid
    component rightValid = IsEqual();
    rightValid.in[0] <== mulFix.out[0];
    rightValid.in[1] <== addRight.xout;

    component leftValid = IsEqual();
    leftValid.in[0] <== mulFix.out[1];
    leftValid.in[1] <== addRight.yout;

    component leftRightValid = IsEqual();
    leftRightValid.in[0] <== rightValid.out + leftValid.out;
    leftRightValid.in[1] <== 2;

    // If A is not zero, isZero.out will be 0.
    // To prevent a scenario where the user can DoS the proof generation by
    // passing in an invalid pubkey, we don't establish a constraint that A is
    // not 0. Rather, if A is 0, valid should be 0. 
    component isZero = IsZero();
    isZero.in <== dbl3.x;

    component iz = IsEqual();
    iz.in[0] <== isZero.out;
    iz.in[1] <== 0;

    // If compConstant.out is not zero, then valid should be 0.
    component isCcZero = IsZero();
    isCcZero.in <== compConstant.out;

    component isValid = IsEqual();
    isValid.in[0] <== leftRightValid.out + iz.out + isCcZero.out;
    isValid.in[1] <== 3;

    valid <== isValid.out;
}

// verify a EdDSA signature
template VerifySignature() {
    // Verify the signature of a Command, which has exactly 4 elements in the
    // hash preimage
    signal input pubKey[2];
    signal input R8[2];
    signal input S;

    var k = 4;
    signal input preimage[k];

    signal output valid;

    component M = Hasher4();
    for (var i = 0; i < k; i++){
        M.in[i] <== preimage[i];
    }

    component verifier = EdDSAPoseidonVerifier_patched();

    verifier.Ax <== pubKey[0];
    verifier.Ay <== pubKey[1];
    verifier.S <== S;
    verifier.R8x <== R8[0];
    verifier.R8y <== R8[1];
    verifier.M <== M.hash;

    valid <== verifier.valid;
}
