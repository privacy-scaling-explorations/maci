pragma circom 2.0.0;

// circomlib import
include "./comparators.circom";
// local imports
include "../trees/QuinaryCheckRoot.circom";
include "../PoseidonHasher.circom";

/**
 * Performs verifications and computations related to current voting results. 
 * Also, computes and outputs a commitment to the new results.
 * This template does not support Quadratic Voting (QV).
 */
 template ResultCommitmentVerifierNonQv(voteOptionTreeDepth) {
    // Number of children per node in the tree, defining the tree's branching factor.
    var TREE_ARITY = 5;
    // Number of voting options available, determined by the depth of the vote option tree.
    var totalVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    // Equal to 1 if this is the first batch, otherwise 0.
    signal input isFirstBatch;
    // Commitment to the current tally before this batch.
    signal input currentTallyCommitment;
    // Commitment to the new tally after processing this batch.
    signal input newTallyCommitment;

    // Current results for each vote option.
    signal input currentResults[totalVoteOptions];
    // Salt for the root of the current results.
    signal input currentResultsRootSalt;

    // New results for each vote option.
    signal input newResults[totalVoteOptions];
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

    // Compute the commitment to the current results.
    var computedCurrentResultsRoot = QuinaryCheckRoot(voteOptionTreeDepth)(currentResults);

    // Verify currentResultsCommitmentHash.
    var computedCurrentResultsCommitment = PoseidonHasher(2)([computedCurrentResultsRoot, currentResultsRootSalt]);

    // Compute the commitment to the current spent voice credits.
    var computedCurrentSpentVoiceCreditsCommitment = PoseidonHasher(2)([currentSpentVoiceCreditSubtotal, currentSpentVoiceCreditSubtotalSalt]);

    // Commit to the current tally
    var computedCurrentTallyCommitment = PoseidonHasher(2)([computedCurrentResultsCommitment, computedCurrentSpentVoiceCreditsCommitment]);

    // Check if the current tally commitment is correct only if this is not the first batch.
    // computedIsZero.out is 1 if this is not the first batch.
    // computedIsZero.out is 0 if this is the first batch.
    var computedIsZero = IsZero()(isFirstBatch);

    // isFirstCommitment is 0 if this is the first batch, currentTallyCommitment should be 0 if this is the first batch.
    // isFirstCommitment is 1 if this is not the first batch, currentTallyCommitment should not be 0 if this is the first batch.
    signal isFirstCommitment;
    isFirstCommitment <== computedIsZero * computedCurrentTallyCommitment;
    isFirstCommitment === currentTallyCommitment;

    // Compute the root of the new results.
    var computedNewResultsRoot = QuinaryCheckRoot(voteOptionTreeDepth)(newResults);
    var computedNewResultsCommitment = PoseidonHasher(2)([computedNewResultsRoot, newResultsRootSalt]);

    // Compute the commitment to the new spent voice credits value.
    var computedNewSpentVoiceCreditsCommitment = PoseidonHasher(2)([newSpentVoiceCreditSubtotal, newSpentVoiceCreditSubtotalSalt]);

    // Commit to the new tally.
    var computedNewTallyCommitment = PoseidonHasher(2)([
        computedNewResultsCommitment,
        computedNewSpentVoiceCreditsCommitment
    ]);
    
    computedNewTallyCommitment === newTallyCommitment;
}
