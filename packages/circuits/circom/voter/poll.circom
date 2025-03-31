pragma circom 2.0.0;

// local imports
include "../utils/hashers.circom";
include "../utils/privToPubKey.circom";
include "../utils/trees/incrementalMerkleTree.circom";

// Poll Joining Circuit
// Allows a user to prove knowledge of a private key that is signed up to 
// a MACI contract.
template PollJoining(stateTreeDepth) {
    // Constants defining the tree structure
    var STATE_TREE_ARITY = 2;

    // User's private key
    signal input privKey;
    // Poll's public key
    signal input pollPubKey[2];
    // Siblings
    signal input siblings[stateTreeDepth][STATE_TREE_ARITY - 1];
    // Indices
    signal input indices[stateTreeDepth];
    // User's hashed private key
    signal input nullifier;
    // MACI State tree root which proves the user is signed up
    signal input stateRoot;
    // The actual tree depth (might be <= stateTreeDepth) used in BinaryMerkleRoot
    signal input actualStateTreeDepth;
    // The poll id
    signal input pollId;

    // Compute the nullifier (hash of private key and poll id)
    var computedNullifier = PoseidonHasher(2)([privKey, pollId]);
    nullifier === computedNullifier;

    // User private to public key
    var derivedPubKey[2] = PrivToPubKey()(privKey);
    // Hash the public key
    var pubKeyHash = PoseidonHasher(2)([derivedPubKey[0], derivedPubKey[1]]);

    // Ensure the poll public key is the same as the maci one (public input)
    derivedPubKey[0] === pollPubKey[0];
    derivedPubKey[1] === pollPubKey[1];

    // Inclusion proof  
    var calculatedRoot = BinaryMerkleRoot(stateTreeDepth)(
        pubKeyHash,
        actualStateTreeDepth,
        indices,
        siblings
    );

    calculatedRoot === stateRoot;
}

// Poll Joined Circuit
// Allows a user to prove that they have joined a MACI poll.
// This is to be used with the MACI offchain implementation to allow 
// users to authenticate to the relayer service (to reduce spamming).
template PollJoined(stateTreeDepth) {
    // Constants defining the tree structure
    var STATE_TREE_ARITY = 2;

    // User's private key
    signal input privKey;
    // User's voice credits balance
    signal input voiceCreditsBalance;
    // Poll's joined timestamp
    signal input joinTimestamp;
    // Path elements
    signal input pathElements[stateTreeDepth][STATE_TREE_ARITY - 1];
    // Path indices
    signal input pathIndices[stateTreeDepth];
    // Poll State tree root which proves the user is joined
    signal input stateRoot;
    // The actual tree depth (might be <= stateTreeDepth) Used in BinaryMerkleRoot
    signal input actualStateTreeDepth;

     // User private to public key
    var derivedPubKey[2] = PrivToPubKey()(privKey);

    var stateLeaf = PoseidonHasher(4)([derivedPubKey[0], derivedPubKey[1], voiceCreditsBalance, joinTimestamp]);

    // Inclusion proof  
    var stateLeafQip = BinaryMerkleRoot(stateTreeDepth)(
        stateLeaf,
        actualStateTreeDepth,
        pathIndices,
        pathElements
    );

    stateLeafQip === stateRoot;
}
