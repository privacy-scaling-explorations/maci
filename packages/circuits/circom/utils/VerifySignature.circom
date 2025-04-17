pragma circom 2.0.0;

// local imports
include "./EdDSAPoseidonVerifier.circom";
include "./PoseidonHasher.circom";

/**
 * Verifies the EdDSA signature for a given command, which has exactly four elements in the hash preimage.
 */
template VerifySignature() {
    // Number of elements in the hash preimage.
    var PRE_IMAGE_LENGTH = 4;

    // Public key of the signer, consisting of two coordinates [x, y].
    signal input publicKey[2];
    // signaturePoint point from the signature, consisting of two coordinates [x, y]. 
    signal input signaturePoint[2];
    // Scalar component of the signature.
    signal input signatureScalar;
    // The preimage data that was hashed, an array of four elements.
    signal input preimage[PRE_IMAGE_LENGTH];
    // The validity of the signature.
    signal output isValid;

    // Hash the preimage using the Poseidon hashing function configured for four inputs.
    var computedPreimage = PoseidonHasher(4)(preimage);

    // Instantiate the patched EdDSA Poseidon verifier with the necessary inputs.
    var computedIsValid = EdDSAPoseidonVerifier()(
        publicKey[0],
        publicKey[1],
        signatureScalar,
        signaturePoint[0],
        signaturePoint[1],
        computedPreimage
    );

    isValid <== computedIsValid;
}
