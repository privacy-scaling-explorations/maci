pragma circom 2.0.0;

// local imports
include "../utils/PoseidonHasher.circom";
include "../utils/PrivateToPublicKey.circom";
include "../utils/trees/BinaryMerkleRoot.circom";

// Poll Joining Circuit
// Allows a user to prove knowledge of a private key that is signed up to 
// a MACI contract.
template PollJoining(stateTreeDepth) {
    // Constants defining the tree structure
    var STATE_TREE_ARITY = 2;

    // User's private key
    signal input privateKey;
    // Poll's public key
    signal input pollPublicKey[2];
    // Siblings
    signal input siblings[stateTreeDepth][STATE_TREE_ARITY - 1];
    // Index
    signal input index;
    // User's hashed private key
    signal input nullifier;
    // MACI State tree root which proves the user is signed up
    signal input stateRoot;
    // The actual tree depth (might be <= stateTreeDepth) used in BinaryMerkleRoot
    signal input actualStateTreeDepth;
    // The poll id
    signal input pollId;

    // Compute the nullifier (hash of private key and poll id)
    var computedNullifier = PoseidonHasher(2)([privateKey, pollId]);
    nullifier === computedNullifier;

    // User private to public key
    var derivedPublicKey[2] = PrivateToPublicKey()(privateKey);
    // Hash the public key
    var publicKeyHash = PoseidonHasher(2)([derivedPublicKey[0], derivedPublicKey[1]]);

    // Ensure the poll public key is the same as the maci one (public input)
    derivedPublicKey[0] === pollPublicKey[0];
    derivedPublicKey[1] === pollPublicKey[1];

    // Inclusion proof  
    var calculatedRoot = BinaryMerkleRoot(stateTreeDepth)(
        publicKeyHash,
        actualStateTreeDepth,
        index,
        siblings
    );

    calculatedRoot === stateRoot;
}
