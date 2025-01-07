pragma circom 2.0.0;

// local imports
include "../utils/hashers.circom";
include "../utils/privToPubKey.circom";
include "../trees/incrementalMerkleTree.circom";

template PollJoining(stateTreeDepth) {
    // Constants defining the tree structure
    var STATE_TREE_ARITY = 2;

    // User's private key
    signal input privKey;
    // Poll's private key
    signal input pollPrivKey;
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
    // The actual tree depth (might be <= stateTreeDepth) Used in BinaryMerkleRoot
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

    // Poll private to public key to verify the correct one is used to join the poll (public input)
    var derivedPollPubKey[2] = PrivToPubKey()(pollPrivKey);
    derivedPollPubKey[0] === pollPubKey[0];
    derivedPollPubKey[1] === pollPubKey[1];

    // Inclusion proof  
    var stateLeafQip = BinaryMerkleRoot(stateTreeDepth)(
        pubKeyHash,
        actualStateTreeDepth,
        indices,
        siblings
    );

    stateLeafQip === stateRoot;
}
