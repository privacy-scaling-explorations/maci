pragma circom 2.0.0;

// circomlib import
include "./comparators.circom";
// zk-kit import
include "./unpack-element.circom";
// local imports
include "../../utils/trees/CheckRoot.circom";
include "../../utils/trees/LeafExists.circom";
include "../../utils/trees/QuinaryCheckRoot.circom";
include "../../utils/qv/ResultCommitmentVerifier.circom";
include "../../utils/CalculateTotal.circom";
include "../../utils/PoseidonHasher.circom";

/**
 * Processes batches of votes and verifies their validity in a Merkle tree structure.
 * This template supports Quadratic Voting (QV) with individual vote counting.
 * Note: this circuit is not using right now, this is a part of individual vote counts functionality.
 * Not finished yet, don't use it in production. It is kept here for future use.
 */
template VoteTallyWithIndividualCountsQv(
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
    var VOTE_COUNTS_TREE_ARITY = 2;

    // The number of ballots processed at once, determined by the depth of the intermediate state tree.
    var ballotBatchSize = BALLOT_TREE_ARITY ** tallyProcessingStateTreeDepth;
    var voteCountsBatchSize = VOTE_COUNTS_TREE_ARITY ** tallyProcessingStateTreeDepth;
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
    // Number of elements in each vote count leaf.
    var VOTE_COUNTS_LENGTH = 2;
    // Index for the voting option index.
    var VOTE_COUNTS_NONCE_INDEX = 0;
    // Index for root of the vote count per option.
    var VOTE_COUNTS_ROOT_INDEX = 1;

    // Root of the state Merkle tree, representing the overall state before voting.
    signal input stateRoot;
    // Root of the ballot Merkle tree, representing the submitted ballots.
    signal input ballotRoot;
    // Root of the vote counts Merkle tree, representing the counts of votes for each option.
    signal input voteCountsRoot;
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
    signal input ballots[ballotBatchSize][BALLOT_LENGTH];
    signal input ballotPathElements[STATE_TREE_DEPTH_DIFFERENCE][BALLOT_TREE_ARITY - 1];
    signal input votes[ballotBatchSize][totalVoteOptions];
    // Individual vote count tree and their corresponding path elements for verification in the tree.
    signal input voteCounts[voteCountsBatchSize][VOTE_COUNTS_LENGTH];
    signal input voteCountsPathElements[STATE_TREE_DEPTH_DIFFERENCE][VOTE_COUNTS_TREE_ARITY - 1];
    signal input voteCountsData[voteCountsBatchSize][totalVoteOptions];
    // Current results for each vote option.
    signal input currentResults[totalVoteOptions];
    // Salt for the root of the current results.
    signal input currentResultsRootSalt;
    // Total voice credits spent so far.
    signal input currentSpentVoiceCreditSubtotal;
    // Salt for the total spent voice credits.
    signal input currentSpentVoiceCreditSubtotalSalt;
    // Spent voice credits per vote option.
    signal input currentPerVoteOptionSpentVoiceCredits[totalVoteOptions];
    // Salt for the root of spent credits per option.
    signal input currentPerVoteOptionSpentVoiceCreditsRootSalt;
    // Salt for the root of the new results.
    signal input newResultsRootSalt;
    // Salt for the new spent credits per vote option root.
    signal input newPerVoteOptionSpentVoiceCreditsRootSalt;
    // Salt for the new total spent voice credits root. 
    signal input newSpentVoiceCreditSubtotalSalt;

    // Verify sbCommitment.
    var computedSbCommitment = PoseidonHasher(3)([stateRoot, ballotRoot, sbSalt]);
    computedSbCommitment === sbCommitment;

    // Validates that the index is within the valid range of sign-ups.
    var totalSignupsValid = LessEqThan(50)([index, totalSignups]);
    totalSignupsValid === 1;

    // Hashes each ballot for subroot generation, and checks the existence of the leaf in the Merkle tree.    
    var computedBallotHashers[ballotBatchSize];
    var computedVoteCountsHashers[voteCountsBatchSize];
    
    for (var i = 0; i < ballotBatchSize; i++) {
        computedBallotHashers[i] = PoseidonHasher(2)([
            ballots[i][BALLOT_NONCE_INDEX],
            ballots[i][BALLOT_VOTE_OPTION_ROOT_INDEX]
        ]);
    }

    for (var i = 0; i < voteCountsBatchSize; i++) {
        computedVoteCountsHashers[i] = PoseidonHasher(2)([
            voteCounts[i][VOTE_COUNTS_NONCE_INDEX],
            voteCounts[i][VOTE_COUNTS_ROOT_INDEX]
        ]);
    }

    var computedBallotSubroot = CheckRoot(tallyProcessingStateTreeDepth)(computedBallotHashers);
    var computedBallotPathIndices[STATE_TREE_DEPTH_DIFFERENCE] = Num2Bits(STATE_TREE_DEPTH_DIFFERENCE)(index / ballotBatchSize);

    var computedVoteCountsSubroot = CheckRoot(tallyProcessingStateTreeDepth)(computedVoteCountsHashers);
    var computedVoteCountsPathIndices[STATE_TREE_DEPTH_DIFFERENCE] = Num2Bits(STATE_TREE_DEPTH_DIFFERENCE)(index / voteCountsBatchSize);

    // Verifies each ballot's existence within the ballot tree.
    LeafExists(STATE_TREE_DEPTH_DIFFERENCE)(
        computedBallotSubroot,
        ballotPathElements,
        computedBallotPathIndices,
        ballotRoot
    );

    // Verifies each vote count's existence within the vote count tree.
    LeafExists(STATE_TREE_DEPTH_DIFFERENCE)(
        computedVoteCountsSubroot,
        voteCountsPathElements,
        computedVoteCountsPathIndices,
        voteCountsRoot
    );

    // Processes vote options, verifying each against its declared root.
    var computedVoteTree[ballotBatchSize];

    for (var i = 0; i < ballotBatchSize; i++) {
        computedVoteTree[i] = QuinaryCheckRoot(voteOptionTreeDepth)(votes[i]);
        computedVoteTree[i] === ballots[i][BALLOT_VOTE_OPTION_ROOT_INDEX];
    }

    // Processes vote counts, verifying each against its declared root.
    var computedVoteCountsTree[voteCountsBatchSize];

    for (var i = 0; i < voteCountsBatchSize; i++) {
        computedVoteCountsTree[i] = QuinaryCheckRoot(voteOptionTreeDepth)(voteCountsData[i]);
        computedVoteCountsTree[i] === voteCounts[i][VOTE_COUNTS_ROOT_INDEX];
    }

    // Calculates new results and spent voice credits based on the current and incoming votes.
    var computedIsFirstBatch = IsZero()(index);
    var computedIsZero = IsZero()(computedIsFirstBatch);

    // Tally the new results.
    var computedCalculateTotalResult[totalVoteOptions];
    for (var i = 0; i < totalVoteOptions; i++) {
        var numsRC[ballotBatchSize + 1];
        numsRC[ballotBatchSize] = currentResults[i] * computedIsZero;
        for (var j = 0; j < ballotBatchSize; j++) {
            numsRC[j] = votes[j][i];
        }

        computedCalculateTotalResult[i] = CalculateTotal(ballotBatchSize + 1)(numsRC);
    }

    // Tally the new spent voice credit total.
    var numsSVC[ballotBatchSize * totalVoteOptions + 1];
    numsSVC[ballotBatchSize * totalVoteOptions] = currentSpentVoiceCreditSubtotal * computedIsZero;
    for (var i = 0; i < ballotBatchSize; i++) {
        for (var j = 0; j < totalVoteOptions; j++) {
            numsSVC[i * totalVoteOptions + j] = votes[i][j] * votes[i][j];
        }
    }

    var computedNewSpentVoiceCreditSubtotal = CalculateTotal(ballotBatchSize * totalVoteOptions + 1)(numsSVC);

    // Tally the spent voice credits per vote option.
    var computedNewPerVOSpentVoiceCredits[totalVoteOptions];

    for (var i = 0; i < totalVoteOptions; i++) {
        var computedTotalVoiceCreditSpent[ballotBatchSize + 1];
        computedTotalVoiceCreditSpent[ballotBatchSize] = currentPerVoteOptionSpentVoiceCredits[i] * computedIsZero;
        for (var j = 0; j < ballotBatchSize; j++) {
            computedTotalVoiceCreditSpent[j] = votes[j][i] * votes[j][i];
        }

        computedNewPerVOSpentVoiceCredits[i] = CalculateTotal(ballotBatchSize + 1)(computedTotalVoiceCreditSpent);
    }
    
    // Verifies the updated results and spent credits, ensuring consistency and correctness of tally updates.
    ResultCommitmentVerifierQv(voteOptionTreeDepth)(
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
        newSpentVoiceCreditSubtotalSalt,
        currentPerVoteOptionSpentVoiceCredits,
        currentPerVoteOptionSpentVoiceCreditsRootSalt,
        computedNewPerVOSpentVoiceCredits,
        newPerVoteOptionSpentVoiceCreditsRootSalt        
    );
}
