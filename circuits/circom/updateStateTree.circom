pragma circom 2.0.0;

// include "./processMessages.circom";
include "./hasherPoseidon.circom";
include "./trees/incrementalQuinTree.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

template UpdateStateTree(
    stateTreeDepth,
    msgTreeDepth,
    msgBatchDepth,
    voteOptionTreeDepth
) {
    assert(stateTreeDepth > 0);
    assert(msgBatchDepth > 0);
    assert(voteOptionTreeDepth > 0);
    assert(msgTreeDepth >= msgBatchDepth);

    var TREE_ARITY = 5;
    var batchSize = TREE_ARITY ** msgBatchDepth; // might not need this

    var MSG_LENGTH = 10;
    var STATE_LEAF_LENGTH = 4;
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;

    // The updated state root with the new balance
    signal output updatedStateRoot;

    // The state root to be updated
    signal input stateIndex;
    signal input stateRoot;
    signal input stateLeaf[STATE_LEAF_LENGTH];
    signal input stateLeafPathElements[stateTreeDepth][TREE_ARITY - 1];

    // The new voice credit balance
    signal input newVoiceCreditBalance;

    // The proof to calculate the new state root
    component stateRootHasher[batchSize];
    component stateLeafPathIndices[batchSize];
    component stateRootQip[batchSize];

    // Validate state leaf
    component stateLeafQip = QuinTreeInclusionProof(stateTreeDepth);
    component stateLeafHasher = Hasher4();

    for (var i = 0; i < STATE_LEAF_LENGTH; i++) {
        stateLeafHasher.in[i] <== stateLeaf[i];
    }

    stateLeafQip.leaf <== stateLeafHasher.hash;
    for (var i = 0; i < stateTreeDepth; i ++) {
        stateLeafPathIndices[i] = QuinGeneratePathIndices(stateTreeDepth);
        stateLeafQip.path_index[i] <== stateLeafPathIndices.out[i];
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            stateLeafQip.path_elements[i][j] <== stateLeafPathElements[i][j];
        }
    }

    stateLeafQip.root === stateRoot;

    // Create a valid command with the voice credit balance unspent for the ballot tree?
    // Generate a new state root with the updated voice credit balance
    // Check blank state roots
}
