pragma circom 2.0.0;

// circomlib import
include "./mux1.circom";
// local imports
include "../../utils/PoseidonHasher.circom";
include "../../utils/trees/MerkleTreeInclusionProof.circom";
include "../../utils/trees/BinaryMerkleRoot.circom";
include "../../utils/trees/QuinaryTreeInclusionProof.circom";
include "../../utils/trees/QuinaryGeneratePathIndices.circom";
include "../../utils/full/StateLeafAndBallotTransformer.circom";

/**
 * Processes one message and updates the state accordingly. 
 * This template involves complex interactions, including transformations based on message type, 
 * validations against current states like voice credit balances or vote weights, 
 * and updates to Merkle trees representing state and ballot information. 
 * This is a critical building block for ensuring the integrity and correctness of MACI state.
 * This template supports fully spent voice credits mode.
 */
template SingleMessageProcessorFull(stateTreeDepth, voteOptionTreeDepth) {
    // The number of elements in the ballot.
    var BALLOT_LENGTH = 2;
    // The number of elements in the state leaf.
    var STATE_LEAF_LENGTH = 3;
    // The number of elements in the vote option tree node (tree arity).
    var VOTE_OPTION_TREE_ARITY = 5;
    // The number of elements in the state tree node (tree arity).
    var STATE_TREE_ARITY = 2;
     // The number of elements in the packed command.
    var PACKED_COMMAND_LENGTH = 4;
     // Constants defining the structure and size of state and ballots.
    var BALLOT_NONCE_INDEX = 0;
    // Ballot vote option (vote option) root index.
    var BALLOT_VOTE_OPTION_ROOT_INDEX = 1;

    // Indices for elements within a state leaf.
    // Public key.
    var STATE_LEAF_PUBLIC_X_INDEX = 0;
    var STATE_LEAF_PUBLIC_Y_INDEX = 1;
    // Voice Credit balance.
    var STATE_LEAF_VOICE_CREDIT_BALANCE_INDEX = 2;

    // Number of users that have completed the sign up.
    signal input totalSignups;
    // The current value of the state tree root.
    signal input currentStateRoot;
    // The current value of the ballot tree root.
    signal input currentBallotRoot;
    // The actual tree depth (might be <= stateTreeDepth).
    signal input actualStateTreeDepth;

    // The state leaf and related path elements.
    signal input stateLeaf[STATE_LEAF_LENGTH];
    // Sibling nodes at each level of the state tree to verify the specific state leaf.
    signal input stateLeafPathElements[stateTreeDepth][STATE_TREE_ARITY - 1];

    // The ballot and related path elements.
    signal input ballot[BALLOT_LENGTH];
    signal input ballotPathElements[stateTreeDepth][STATE_TREE_ARITY - 1];

    // The current vote weight and related path elements.
    signal input currentVoteWeight;
    signal input currentVoteWeightsPathElements[voteOptionTreeDepth][VOTE_OPTION_TREE_ARITY - 1];

    // Inputs related to the command being processed.
    signal input commandStateIndex;
    signal input commandPublicKey[2];
    signal input commandVoteOptionIndex;
    signal input commandNewVoteWeight;
    signal input commandNonce;
    signal input commandPollId;
    signal input commandSalt;
    signal input commandSignaturePoint[2];
    signal input commandSignatureScalar;
    signal input packedCommand[PACKED_COMMAND_LENGTH];

    // The number of valid vote options for the poll.
    signal input voteOptions;

    // The new state root.
    signal output newStateRoot;
    // The new ballot root.
    signal output newBallotRoot;

    // equal to newBallotVoteOptionRootMux (Mux1).
    signal newBallotVoteOptionRoot;

    // 1. Transform a state leaf and a ballot with a command.
    // The result is a new state leaf, a new ballot, and an isValid signal (0 or 1).
    var computedNewstateLeafPublicKey[2], computedNewBallotNonce, computedIsValid, computedIsStateLeafIndexValid, computedIsVoteOptionIndexValid;
    (computedNewstateLeafPublicKey, computedNewBallotNonce, computedIsValid, computedIsStateLeafIndexValid, computedIsVoteOptionIndexValid) = StateLeafAndBallotTransformerFull()(
        totalSignups,
        voteOptions,
        [stateLeaf[STATE_LEAF_PUBLIC_X_INDEX], stateLeaf[STATE_LEAF_PUBLIC_Y_INDEX]],
        stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_INDEX],
        ballot[BALLOT_NONCE_INDEX],
        currentVoteWeight,
        commandStateIndex,
        commandPublicKey,
        commandVoteOptionIndex,
        commandNewVoteWeight,
        commandNonce,
        commandPollId,
        commandSalt,
        commandSignaturePoint,
        commandSignatureScalar,
        packedCommand
    );

    // 2. If computedIsStateLeafIndexValid is equal to zero, generate indices for leaf zero.
    // Otherwise, generate indices for command.stateIndex.
    var stateIndexMux = Mux1()([0, commandStateIndex], computedIsStateLeafIndexValid);

    // 3. Verify that the original state leaf exists in the given state root.
    var stateLeafHash = PoseidonHasher(3)(stateLeaf);
    var computedStateRoot = BinaryMerkleRoot(stateTreeDepth)(
        stateLeafHash,
        actualStateTreeDepth,
        stateIndexMux,
        stateLeafPathElements
    );

    computedStateRoot === currentStateRoot;

    // 4. Verify that the original ballot exists in the given ballot root.
    var computedBallot = PoseidonHasher(2)([
        ballot[BALLOT_NONCE_INDEX], 
        ballot[BALLOT_VOTE_OPTION_ROOT_INDEX]
    ]);
    var computedStateLeafPathIndices[stateTreeDepth] = Num2Bits(stateTreeDepth)(stateIndexMux);

    var computedBallotRoot = MerkleTreeInclusionProof(stateTreeDepth)(
        computedBallot,
        computedStateLeafPathIndices,
        ballotPathElements
    );

    computedBallotRoot === currentBallotRoot;

    // 5. Verify that currentVoteWeight exists in the ballot's vote option root
    // at commandVoteOptionIndex.
    var commandVoteOptionIndexMux = Mux1()([0, commandVoteOptionIndex], computedIsVoteOptionIndexValid);
    var computedCurrentVoteWeightPathIndices[voteOptionTreeDepth] = QuinaryGeneratePathIndices(voteOptionTreeDepth)(commandVoteOptionIndexMux);

    var computedCurrentVoteWeightRoot = QuinaryTreeInclusionProof(voteOptionTreeDepth)(
        currentVoteWeight,
        computedCurrentVoteWeightPathIndices,
        currentVoteWeightsPathElements
    );

    computedCurrentVoteWeightRoot === ballot[BALLOT_VOTE_OPTION_ROOT_INDEX];

    var voteWeightMux = Mux1()([currentVoteWeight, commandNewVoteWeight], computedIsValid);
    var voiceCreditBalanceMux = Mux1()(
        [
            stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_INDEX],
            stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_INDEX] + currentVoteWeight - commandNewVoteWeight
        ],
        computedIsValid
    );

    // 5.1. Update the ballot's vote option root with the new vote weight.
    var computedNewVoteOptionTreeRoot = QuinaryTreeInclusionProof(voteOptionTreeDepth)(
        voteWeightMux,
        computedCurrentVoteWeightPathIndices,
        currentVoteWeightsPathElements
    );

    // The new vote option root in the ballot
    var newBallotVoteOptionRootMux = Mux1()(
        [ballot[BALLOT_VOTE_OPTION_ROOT_INDEX], computedNewVoteOptionTreeRoot],
        computedIsValid
    );

    newBallotVoteOptionRoot <== newBallotVoteOptionRootMux;

    // 6. Generate a new state root.
    var computedNewStateLeafhash = PoseidonHasher(3)([
        computedNewstateLeafPublicKey[STATE_LEAF_PUBLIC_X_INDEX],
        computedNewstateLeafPublicKey[STATE_LEAF_PUBLIC_Y_INDEX],
        voiceCreditBalanceMux
    ]);

    var computedNewStateRoot = BinaryMerkleRoot(stateTreeDepth)(
        computedNewStateLeafhash,
        actualStateTreeDepth,
        stateIndexMux,
        stateLeafPathElements
    );

    newStateRoot <== computedNewStateRoot;
 
    // 7. Generate a new ballot root.    
    var computedNewBallot = PoseidonHasher(2)([computedNewBallotNonce, newBallotVoteOptionRoot]);
    var computedNewBallotRoot = MerkleTreeInclusionProof(stateTreeDepth)(
        computedNewBallot,
        computedStateLeafPathIndices,
        ballotPathElements
    );

    newBallotRoot <== computedNewBallotRoot;
}
