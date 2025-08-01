pragma circom 2.0.0;

// circomlib import
include "./comparators.circom";
// zk-kit import
include "./unpack-element.circom";
// local imports
include "../../utils/non-qv/ResultCommitmentVerifier.circom";
include "../../utils/trees/CheckRoot.circom";
include "../../utils/trees/LeafExists.circom";
include "../../utils/trees/QuinaryCheckRoot.circom";
include "../../utils/CalculateTotal.circom";
include "../../utils/PoseidonHasher.circom";

/**
 * Processes batches of votes and verifies their validity in a Merkle tree structure.
 * This template does not support Quadratic Voting (QV).
 */
template VoteTallyNonQv(
    stateTreeDepth,
    tallyProcessingStateTreeDepth,
    voteOptionTreeDepth
) {
    // Ensure there's at least one level in the vote option tree.
    assert(voteOptionTreeDepth > 0);
    // Ensure the intermediate state tree has at least one level.
    assert(tallyProcessingStateTreeDepth > 0);
    // The intermediate state tree must be smaller than the full state tree.
    assert(tallyProcessingStateTreeDepth < stateTreeDepth); 

    // Number of children per node in the tree, defining the tree's branching factor.
    var TREE_ARITY = 5;
    var BALLOT_TREE_ARITY = 2;

    // The number of ballots processed at once, determined by the depth of the intermediate state tree.
    var batchSize = BALLOT_TREE_ARITY ** tallyProcessingStateTreeDepth;
    // Number of voting options available, determined by the depth of the vote option tree.
    var totalVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    // Number of elements in each ballot.
    var BALLOT_LENGTH = 2;
    // Index for the nonce in the ballot array.
    var BALLOT_NONCE_INDEX = 0;
    // Index for the voting option root in the ballot array.
    var BALLOT_VOTE_OPTION_ROOT_INDEX = 1;
    // Difference in tree depths, used in path calculations.
    var STATE_TREE_DEPTH_DIFFERENCE = stateTreeDepth - tallyProcessingStateTreeDepth;

    // Root of the state Merkle tree, representing the overall state before voting.
    signal input stateRoot;
    // Root of the ballot Merkle tree, representing the submitted ballots.
    signal input ballotRoot;
    // Salt used in commitment to secure the ballot data.
    signal input sbSalt;
    // Commitment to the state and ballots.
    signal input sbCommitment;
    // Commitment to the current tally before this batch.
    signal input currentTallyCommitment;
    // Commitment to the new tally after processing this batch.
    signal input newTallyCommitment;
    // Start index of given batch
    signal input index;
    // Number of users that signup
    signal input totalSignups;
    // Ballots and their corresponding path elements for verification in the tree.
    signal input ballots[batchSize][BALLOT_LENGTH];
    signal input ballotPathElements[STATE_TREE_DEPTH_DIFFERENCE][BALLOT_TREE_ARITY - 1];
    signal input votes[batchSize][totalVoteOptions];
    // Current results for each vote option.
    signal input currentResults[totalVoteOptions];
    // Salt for the root of the current results.
    signal input currentResultsRootSalt;
    // Total voice credits spent so far.
    signal input currentSpentVoiceCreditSubtotal;
    // Salt for the total spent voice credits.
    signal input currentSpentVoiceCreditSubtotalSalt;
    // Salt for the root of the new results.
    signal input newResultsRootSalt;
    // Salt for the new total spent voice credits root. 
    signal input newSpentVoiceCreditSubtotalSalt;

    // Verify sbCommitment.
    var computedSbCommitment = PoseidonHasher(3)([stateRoot, ballotRoot, sbSalt]);
    computedSbCommitment === sbCommitment;


    // Validates that the index is within the valid range of sign-ups.
    var totalSignupsValid = LessEqThan(50)([index, totalSignups]);
    totalSignupsValid === 1;

    // Hashes each ballot for subroot generation, and checks the existence of the leaf in the Merkle tree.    
    var computedBallotHashers[batchSize];
    
    for (var i = 0; i < batchSize; i++) {
        computedBallotHashers[i] = PoseidonHasher(2)([ballots[i][BALLOT_NONCE_INDEX], ballots[i][BALLOT_VOTE_OPTION_ROOT_INDEX]]);
    }

    var computedBallotSubroot = CheckRoot(tallyProcessingStateTreeDepth)(computedBallotHashers);
    var computedBallotPathIndices[STATE_TREE_DEPTH_DIFFERENCE] = Num2Bits(STATE_TREE_DEPTH_DIFFERENCE)(index / batchSize); 

    // Verifies each ballot's existence within the ballot tree.
    LeafExists(STATE_TREE_DEPTH_DIFFERENCE)(
        computedBallotSubroot,
        ballotPathElements,
        computedBallotPathIndices,
        ballotRoot
    );

    // Processes vote options, verifying each against its declared root.
    var computedVoteTree[batchSize];

    for (var i = 0; i < batchSize; i++) {
        computedVoteTree[i] = QuinaryCheckRoot(voteOptionTreeDepth)(votes[i]);
        computedVoteTree[i] === ballots[i][BALLOT_VOTE_OPTION_ROOT_INDEX];
    }

    // Calculates new results and spent voice credits based on the current and incoming votes.
    var computedIsFirstBatch = IsZero()(index);
    var computedIsZero = IsZero()(computedIsFirstBatch);

    // Tally the new results.
    var computedCalculateTotalResult[totalVoteOptions];

    for (var i = 0; i < totalVoteOptions; i++) {
        var computedVotes[batchSize + 1];
        computedVotes[batchSize] = currentResults[i] * computedIsZero;

        for (var j = 0; j < batchSize; j++) {
            computedVotes[j] = votes[j][i];
        }

        computedCalculateTotalResult[i] = CalculateTotal(batchSize + 1)(computedVotes);
    }

    // Tally the new spent voice credit total.
    var computedTotalVoiceCreditSpent[batchSize * totalVoteOptions + 1];
    computedTotalVoiceCreditSpent[batchSize * totalVoteOptions] = currentSpentVoiceCreditSubtotal * computedIsZero;

    for (var i = 0; i < batchSize; i++) {
        for (var j = 0; j < totalVoteOptions; j++) {
            computedTotalVoiceCreditSpent[i * totalVoteOptions + j] = votes[i][j];
        }
    }

    var computedNewSpentVoiceCreditSubtotal = CalculateTotal(batchSize * totalVoteOptions + 1)(computedTotalVoiceCreditSpent);

    // Verifies the updated results and spent credits, ensuring consistency and correctness of tally updates.
    ResultCommitmentVerifierNonQv(voteOptionTreeDepth)(
        computedIsFirstBatch,
        currentTallyCommitment,
        newTallyCommitment,
        currentResults,
        currentResultsRootSalt,
        computedCalculateTotalResult,
        newResultsRootSalt,
        currentSpentVoiceCreditSubtotal,
        currentSpentVoiceCreditSubtotalSalt,
        computedNewSpentVoiceCreditSubtotal,
        newSpentVoiceCreditSubtotalSalt        
    );
}
