pragma circom 2.0.0;

// circomlib import
include "./mux1.circom";
// zk-kit imports
include "./safe-comparators.circom";
// local imports
include "../utils/hashers.circom";
include "../utils/privToPubKey.circom";
include "../trees/incrementalMerkleTree.circom";

template PollJoining(stateTreeDepth) {
    // Constants defining the structure and size of state.
    var STATE_LEAF_LENGTH = 4;
    var STATE_TREE_ARITY = 2;

    // Public key IDs.
    var STATE_LEAF_PUB_X_IDX = 0;
    var STATE_LEAF_PUB_Y_IDX = 1;
    // Voice Credit balance id
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;
    var N_BITS = 252;

    // User's private key
    signal input privKey;
    // Poll's private key
    signal input pollPrivKey;
    // Poll's public key
    signal input pollPubKey[2];
    // The state leaf and related path elements.
    signal input stateLeaf[STATE_LEAF_LENGTH];
    // Siblings
    signal input siblings[stateTreeDepth][STATE_TREE_ARITY - 1];
    // Indices
    signal input indices[stateTreeDepth];
    // User's hashed private key
    signal input nullifier;
    // User's credits for poll joining (might be <= oldCredits)
    signal input credits;
    // MACI State tree root which proves the user is signed up
    signal input stateRoot;
    // The actual tree depth (might be <= stateTreeDepth) Used in BinaryMerkleRoot
    signal input actualStateTreeDepth;

    var computedNullifier = PoseidonHasher(1)([privKey]);
    nullifier === computedNullifier;

    // User private to public key
    var derivedPubKey[2] = PrivToPubKey()(privKey);
    derivedPubKey[0] === stateLeaf[STATE_LEAF_PUB_X_IDX];
    derivedPubKey[1] === stateLeaf[STATE_LEAF_PUB_Y_IDX];
    
    // Poll private to public key
    var derivedPollPubKey[2] = PrivToPubKey()(pollPrivKey);
    derivedPollPubKey[0] === pollPubKey[0];
    derivedPollPubKey[1] === pollPubKey[1];

    // Inclusion proof  
    var stateLeafHash = PoseidonHasher(4)(stateLeaf);
    var stateLeafQip = BinaryMerkleRoot(stateTreeDepth)(
        stateLeafHash,
        actualStateTreeDepth,
        indices,
        siblings
    );

    stateLeafQip === stateRoot;

    // Check credits
    var isCreditsValid = SafeLessEqThan(N_BITS)([credits, stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX]]);
    isCreditsValid === 1;

    // Check nullifier
    var hashedPrivKey = PoseidonHasher(1)([privKey]);
    hashedPrivKey === nullifier;
}
