pragma circom 2.0.0;

// circomlib import
include "./mux1.circom";
// zk-kit imports
include "./safe-comparators.circom";
// local imports
include "./hashers.circom";
include "../trees/incrementalQuinaryTree.circom";

/**
 * Processes top-ups for a state tree, managing updates based on the transaction's message type and amount. 
 * Through conditional logic ensures messages are valid within the specified state tree depth and user sign-up count. 
 * Through mux components and balance checks, it updates the state leaf's voice credit balance, while verifying 
 * the message fields against the current state tree structure.
 * 
 * nb. the message type of top-up command is always equal to two.
 */
template ProcessTopup(stateTreeDepth) {
    // Constants defining the structure and size of state and ballots.
    var STATE_LEAF_LENGTH = 4;
    var MSG_LENGTH = 11;
    var TREE_ARITY = 5;

    // Indices for elements within a state leaf.
    // Public key.
    var STATE_LEAF_PUB_X_IDX = 0;
    var STATE_LEAF_PUB_Y_IDX = 1;
    // Voice Credit balance.
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;
    // Timestamp.
    var STATE_LEAF_TIMESTAMP_IDX = 3;
    var N_BITS = 252;

    // Inputs for the template.
    signal input msgType;
    signal input stateTreeIndex;
    signal input amount;
    signal input numSignUps;

    // The state leaf and related path elements.
    signal input stateLeaf[STATE_LEAF_LENGTH];
    // Sibling nodes at each level of the state tree to verify the specific state leaf.
    signal input stateLeafPathElements[stateTreeDepth][TREE_ARITY - 1];

    signal output newStateRoot;

    // skipping state leaf verify (checked in ProcessOne template).     
    
    // Amount to be processed, adjusted based on msgType.
    signal amt;
    // State tree index, adjusted based on msgType.
    signal index;
    // New credit balance after processing the message.
    signal newCreditBalance;

    // nb. msgType of top-up command is 2.
    amt <== amount * (msgType - 1); 
    index <== stateTreeIndex * (msgType - 1);
    
    // check the state index and, if invalid, set index and amount to zero.
    var computedIsStateLeafIndexValid = LessEqThan(N_BITS)([index, numSignUps]);
    var computedIndexMux = Mux1()([0, index], computedIsStateLeafIndexValid);
    var computedAmtMux =  Mux1()([0, amt], computedIsStateLeafIndexValid);
    
    // check less than field size.
    newCreditBalance <== stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX] + computedAmtMux;

    var computedIsCreditBalanceValid = LessEqThan(N_BITS)([
        stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX],
        newCreditBalance
    ]);

    // If the new one is <= the old one, then we have a valid topup.
    var computedCreditBalanceMux = Mux1()([stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX], newCreditBalance], computedIsCreditBalanceValid);

    // update the voice balance balance.
    var computedNewStateLeaf = PoseidonHasher(4)([
        stateLeaf[STATE_LEAF_PUB_X_IDX],
        stateLeaf[STATE_LEAF_PUB_Y_IDX],
        computedCreditBalanceMux,
        stateLeaf[STATE_LEAF_TIMESTAMP_IDX]
    ]);

    var computedStateLeafPathIndices[stateTreeDepth] = QuinGeneratePathIndices(stateTreeDepth)(computedIndexMux);
    newStateRoot <== QuinTreeInclusionProof(stateTreeDepth)(
        computedNewStateLeaf,
        computedStateLeafPathIndices,
        stateLeafPathElements
    );
}