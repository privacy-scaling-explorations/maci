pragma circom 2.0.0;

// local imports
include "../utils/PoseidonHasher.circom";
include "../utils/PrivateToPublicKey.circom";
include "../utils/trees/BinaryMerkleRoot.circom";

// Poll Joined Circuit
// Allows a user to prove that they have joined a MACI poll.
// This is to be used with the MACI offchain implementation to allow 
// users to authenticate to the relayer service (to reduce spamming).
template PollJoined(stateTreeDepth) {
    // Constants defining the tree structure
    var STATE_TREE_ARITY = 2;

    // User's private key
    signal input privateKey;
    // User's voice credits balance
    signal input voiceCreditsBalance;
    // Path elements
    signal input pathElements[stateTreeDepth][STATE_TREE_ARITY - 1];
    // Path indices
    signal input pathIndices[stateTreeDepth];
    // Poll State tree root which proves the user is joined
    signal input stateRoot;
    // The actual tree depth (might be <= stateTreeDepth) Used in BinaryMerkleRoot
    signal input actualStateTreeDepth;

     // User private to public key
    var derivedPublicKey[2] = PrivateToPublicKey()(privateKey);

    var stateLeaf = PoseidonHasher(3)([derivedPublicKey[0], derivedPublicKey[1], voiceCreditsBalance]);

    // Inclusion proof  
    var calculatedRoot = BinaryMerkleRoot(stateTreeDepth)(
        stateLeaf,
        actualStateTreeDepth,
        pathIndices,
        pathElements
    );

    calculatedRoot === stateRoot;
}
