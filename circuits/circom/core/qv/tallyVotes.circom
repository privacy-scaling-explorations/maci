pragma circom 2.0.0;

// circomlib import
include "./comparators.circom";
// zk-kit import
include "./unpack-element.circom";
// local imports
include "../../trees/incrementalMerkleTree.circom";
include "../../trees/incrementalQuinaryTree.circom";
include "../../utils/calculateTotal.circom";
include "../../utils/hashers.circom";

/**
 * Processes batches of votes and verifies their validity in a Merkle tree structure.
 * This template supports Quadratic Voting (QV).
 */
template TallyVotes(
    stateTreeDepth,
    intStateTreeDepth,
    voteOptionTreeDepth
) {
    // Ensure there's at least one level in the vote option tree.
    assert(voteOptionTreeDepth > 0);
    // Ensure the intermediate state tree has at least one level.
    assert(intStateTreeDepth > 0);
    // The intermediate state tree must be smaller than the full state tree.
    assert(intStateTreeDepth < stateTreeDepth); 

    // Number of children per node in the tree, defining the tree's branching factor.
    var TREE_ARITY = 5;
    var BALLOT_TREE_ARITY = 2;

    // The number of ballots processed at once, determined by the depth of the intermediate state tree.
    var batchSize = BALLOT_TREE_ARITY ** intStateTreeDepth;
    // Number of voting options available, determined by the depth of the vote option tree.
    var numVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    // Number of elements in each ballot.
    var BALLOT_LENGTH = 2;
    // Index for the nonce in the ballot array.
    var BALLOT_NONCE_IDX = 0;
    // Index for the voting option root in the ballot array.
    var BALLOT_VO_ROOT_IDX = 1;
    // Difference in tree depths, used in path calculations.
    var k = stateTreeDepth - intStateTreeDepth;

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
    signal input numSignUps;
    // Ballots and their corresponding path elements for verification in the tree.
    signal input ballots[batchSize][BALLOT_LENGTH];
    signal input ballotPathElements[k][BALLOT_TREE_ARITY - 1];
    signal input votes[batchSize][numVoteOptions];
    // Current results for each vote option.
    signal input currentResults[numVoteOptions];
    // Salt for the root of the current results.
    signal input currentResultsRootSalt;
    // Total voice credits spent so far.
    signal input currentSpentVoiceCreditSubtotal;
    // Salt for the total spent voice credits.
    signal input currentSpentVoiceCreditSubtotalSalt;
    // Spent voice credits per vote option.
    signal input currentPerVOSpentVoiceCredits[numVoteOptions];
    // Salt for the root of spent credits per option.
    signal input currentPerVOSpentVoiceCreditsRootSalt;
    // Salt for the root of the new results.
    signal input newResultsRootSalt;
    // Salt for the new spent credits per vote option root.
    signal input newPerVOSpentVoiceCreditsRootSalt;
    // Salt for the new total spent voice credits root. 
    signal input newSpentVoiceCreditSubtotalSalt;

    // Verify sbCommitment.
    var computedSbCommitment = PoseidonHasher(3)([stateRoot, ballotRoot, sbSalt]);
    computedSbCommitment === sbCommitment;

    // Validates that the index is within the valid range of sign-ups.
    var numSignUpsValid = LessEqThan(50)([index, numSignUps]);
    numSignUpsValid === 1;

    // Hashes each ballot for subroot generation, and checks the existence of the leaf in the Merkle tree.    
    var computedBallotHashers[batchSize];
    
    for (var i = 0; i < batchSize; i++) {
        computedBallotHashers[i] = PoseidonHasher(2)([ballots[i][BALLOT_NONCE_IDX], ballots[i][BALLOT_VO_ROOT_IDX]]);
    }

    var computedBallotSubroot = CheckRoot(intStateTreeDepth)(computedBallotHashers);
    var computedBallotPathIndices[k] = MerkleGeneratePathIndices(k)(index / batchSize);

    // Verifies each ballot's existence within the ballot tree.
    LeafExists(k)(
        computedBallotSubroot,
        ballotPathElements,
        computedBallotPathIndices,
        ballotRoot
    );

    // Processes vote options, verifying each against its declared root.
    var computedVoteTree[batchSize];
    for (var i = 0; i < batchSize; i++) {
        computedVoteTree[i] = QuinCheckRoot(voteOptionTreeDepth)(votes[i]);
        computedVoteTree[i] === ballots[i][BALLOT_VO_ROOT_IDX];
    }

    // Calculates new results and spent voice credits based on the current and incoming votes.
    var computedIsFirstBatch = IsZero()(index);
    var computedIsZero = IsZero()(computedIsFirstBatch);

    // Tally the new results.
    var computedCalculateTotalResult[numVoteOptions];
    for (var i = 0; i < numVoteOptions; i++) {
        var numsRC[batchSize + 1];
        numsRC[batchSize] = currentResults[i] * computedIsZero;
        for (var j = 0; j < batchSize; j++) {
            numsRC[j] = votes[j][i];
        }

        computedCalculateTotalResult[i] = CalculateTotal(batchSize + 1)(numsRC);
    }

    // Tally the new spent voice credit total.
    var numsSVC[batchSize * numVoteOptions + 1];
    numsSVC[batchSize * numVoteOptions] = currentSpentVoiceCreditSubtotal * computedIsZero;
    for (var i = 0; i < batchSize; i++) {
        for (var j = 0; j < numVoteOptions; j++) {
            numsSVC[i * numVoteOptions + j] = votes[i][j] * votes[i][j];
        }
    }

    var computedNewSpentVoiceCreditSubtotal = CalculateTotal(batchSize * numVoteOptions + 1)(numsSVC);

    // Tally the spent voice credits per vote option.
    var computedNewPerVOSpentVoiceCredits[numVoteOptions];

    for (var i = 0; i < numVoteOptions; i++) {
        var computedNumsSVC[batchSize + 1];
        computedNumsSVC[batchSize] = currentPerVOSpentVoiceCredits[i] * computedIsZero;
        for (var j = 0; j < batchSize; j++) {
            computedNumsSVC[j] = votes[j][i] * votes[j][i];
        }

        computedNewPerVOSpentVoiceCredits[i] = CalculateTotal(batchSize + 1)(computedNumsSVC);
    }
    
    // Verifies the updated results and spent credits, ensuring consistency and correctness of tally updates.
    ResultCommitmentVerifier(voteOptionTreeDepth)(
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
        currentPerVOSpentVoiceCredits,
        currentPerVOSpentVoiceCreditsRootSalt,
        computedNewPerVOSpentVoiceCredits,
        newPerVOSpentVoiceCreditsRootSalt        
    );
}

/** 
 * Performs verifications and computations related to current voting results. 
 * Also, computes and outputs a commitment to the new results.
 * This template supports the Quadratic Voting (QV).
 */
template ResultCommitmentVerifier(voteOptionTreeDepth) {
    // Number of children per node in the tree, defining the tree's branching factor.
    var TREE_ARITY = 5;
    // Number of voting options available, determined by the depth of the vote option tree.
    var numVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    // Equal to 1 if this is the first batch, otherwise 0.
    signal input isFirstBatch;
    // Commitment to the current tally before this batch.
    signal input currentTallyCommitment;
    // Commitment to the new tally after processing this batch.
    signal input newTallyCommitment;

    // Current results for each vote option.
    signal input currentResults[numVoteOptions];
    // Salt for the root of the current results.
    signal input currentResultsRootSalt;

    // New results for each vote option.
    signal input newResults[numVoteOptions];
    // Salt for the root of the new results.
    signal input newResultsRootSalt;

    // Total voice credits spent so far.
    signal input currentSpentVoiceCreditSubtotal;
    // Salt for the total spent voice credits.
    signal input currentSpentVoiceCreditSubtotalSalt;

    // Total new voice credits spent.
    signal input newSpentVoiceCreditSubtotal;
    // Salt for the new total spent voice credits.
    signal input newSpentVoiceCreditSubtotalSalt;

    // Spent voice credits per vote option.
    signal input currentPerVOSpentVoiceCredits[numVoteOptions];
    // Salt for the root of spent credits per option.
    signal input currentPerVOSpentVoiceCreditsRootSalt;

    // New spent voice credits per vote option.
    signal input newPerVOSpentVoiceCredits[numVoteOptions];
    // Salt for the root of new spent credits per option.
    signal input newPerVOSpentVoiceCreditsRootSalt;

    // Compute the commitment to the current results.
    var computedCurrentResultsRoot = QuinCheckRoot(voteOptionTreeDepth)(currentResults);

    // Verify currentResultsCommitmentHash.
    var computedCurrentResultsCommitment = PoseidonHasher(2)([computedCurrentResultsRoot, currentResultsRootSalt]);

    // Compute the commitment to the current spent voice credits.
    var computedCurrentSpentVoiceCreditsCommitment = PoseidonHasher(2)([currentSpentVoiceCreditSubtotal, currentSpentVoiceCreditSubtotalSalt]);

    // Compute the root of the spent voice credits per vote option.
    var computedCurrentPerVOSpentVoiceCreditsRoot = QuinCheckRoot(voteOptionTreeDepth)(currentPerVOSpentVoiceCredits);
    var computedCurrentPerVOSpentVoiceCreditsCommitment = PoseidonHasher(2)([computedCurrentPerVOSpentVoiceCreditsRoot, currentPerVOSpentVoiceCreditsRootSalt]);

    // Commit to the current tally.
    var computedCurrentTallyCommitment = PoseidonHasher(3)([
        computedCurrentResultsCommitment, 
        computedCurrentSpentVoiceCreditsCommitment, 
        computedCurrentPerVOSpentVoiceCreditsCommitment
    ]);

    // Check if the current tally commitment is correct only if this is not the first batch.
    // computedIsZero.out is 1 if this is not the first batch.
    // computedIsZero.out is 0 if this is the first batch.
    var computedIsZero = IsZero()(isFirstBatch);

    // hz is 0 if this is the first batch, currentTallyCommitment should be 0 if this is the first batch.
    // hz is 1 if this is not the first batch, currentTallyCommitment should not be 0 if this is the first batch.
    signal hz;
    hz <== computedIsZero * computedCurrentTallyCommitment;
    hz === currentTallyCommitment;

    // Compute the root of the new results.
    var computedNewResultsRoot = QuinCheckRoot(voteOptionTreeDepth)(newResults);
    var computedNewResultsCommitment = PoseidonHasher(2)([computedNewResultsRoot, newResultsRootSalt]);

    // Compute the commitment to the new spent voice credits value.
    var computedNewSpentVoiceCreditsCommitment = PoseidonHasher(2)([newSpentVoiceCreditSubtotal, newSpentVoiceCreditSubtotalSalt]);

    // Compute the root of the spent voice credits per vote option.
    var computedNewPerVOSpentVoiceCreditsRoot = QuinCheckRoot(voteOptionTreeDepth)(newPerVOSpentVoiceCredits);
    var computedNewPerVOSpentVoiceCreditsCommitment = PoseidonHasher(2)([computedNewPerVOSpentVoiceCreditsRoot, newPerVOSpentVoiceCreditsRootSalt]);

    // Commit to the new tally.
    var computedNewTallyCommitment = PoseidonHasher(3)([
        computedNewResultsCommitment,
        computedNewSpentVoiceCreditsCommitment,
        computedNewPerVOSpentVoiceCreditsCommitment
    ]);
    
    computedNewTallyCommitment === newTallyCommitment;
}
