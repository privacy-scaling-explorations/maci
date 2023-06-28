pragma circom 2.0.0;

include "./hasherSha256.circom";

template GenerateKeyFromDeactivated(STATE_TREE_DEPTH) {
    var TREE_ARITY = 5;

    signal input inputHash; // Hashed inputs
    
    // Private key of the deactivated key
    signal input oldPrivKey;

    // Private key of the new key
    signal input newPrivKey;

    // State index of the old key
    signal input stateIndex;

    // Salt used for key deactivation
    signal input salt;

    // State tree root
    signal input stateRoot;

    // Deactivated keys root
    signal input deactivatedKeysRoot;

    // State tree inclusion proof
    signal input stateTreeInclusionProof[STATE_TREE_DEPTH][TREE_ARITY - 1];

    // Old credit balance
    signal input oldCreditBalance;

    // New credit balance
    signal input newCreditBalance;

    // State leaf generation timestamp
    signal input stateLeafTimestamp

    // Deactivated keys tree inclusion proof
    signal input deactivatedKeysInclusionProof[STATE_TREE_DEPTH][TREE_ARITY - 1];

    // Deactivated key encrypted status
    signal input c1[2];
    signal input c2[2];

    // Coordinator's public key
    signal input coordinatorPubKey

    // Rerandomized ciphertext
    signal input c1r[2];
    signal input c2r[2];

    // Rerandomization value
    signal input z;

    // Deactivation nullifier
    signal input nullifier;

    // ==============================================

    // 1. Construct old state leaf
    // [pubX, pubY, creditBalance, timestamp]

    // 2. Create state tree leaf hash

    // 3. Verify state tree inclusion proof

    // 4. Verify new balance value

    // 5. Create deactivated key leaf hash

    // 6. Verify deactivated key inclusion proof

    // 7. Verify nullifier construction 
    // hash(newPriv, salt)

    // 8. Verify rerandomized values

    // 9. Verify output hash

    component inputHasher = Sha256Hasher(7);
    hash.in[0] <== stateTreeRoot;
    hash.in[1] <== deactivatedKeysRoot;
    nash.in[2] <== nullifier;
    nash.in[3] <== c1r[0];
    nash.in[4] <== c1r[1];
    nash.in[5] <== c2r[0];
    nash.in[6] <== c2r[1];

    inputHasher.hash === inputHash;
}
