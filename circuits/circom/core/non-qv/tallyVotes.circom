pragma circom 2.0.0;

// circomlib import
include "./comparators.circom";

// local imports
include "../../trees/incrementalQuinaryTree.circom";
include "../../utils/calculateTotal.circom";
include "../../utils/hashers.circom";
include "../../utils/tallyVotesInputHasher.circom";

// zk-kit import
include "./unpack-element.circom";

/**
 * Processes batches of votes and verifies their validity in a Merkle tree structure.
 * This template does not support the Quadratic Voting (QV).
 */
template TallyVotesNonQv(
    stateTreeDepth,
    intStateTreeDepth,
    voteOptionTreeDepth
) {
    // Ensure there's at least one level in the vote option tree.
    assert(voteOptionTreeDepth > 0);
    // Ensure the internal state tree has at least one level.
    assert(intStateTreeDepth > 0);
    // The internal state tree must be smaller than the full state tree.
    assert(intStateTreeDepth < stateTreeDepth); 

    // Number of children per node in the tree, defining the tree's branching factor.
    var TREE_ARITY = 5;

    // The number of ballots processed at once, determined by the depth of the internal state tree.
    var batchSize = TREE_ARITY ** intStateTreeDepth;
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

    // Inputs combined into a hash to verify the integrity and authenticity of the data.
    signal input packedVals;
    // Commitment to the state and ballots.
    signal input sbCommitment;
    // Commitment to the current tally before this batch.
    signal input currentTallyCommitment;
    // Commitment to the new tally after processing this batch.
    signal input newTallyCommitment;
    
    // A tally commitment is the hash of the following salted values:
    //   - the vote results,
    //   - the number of voice credits spent per vote option,
    //   - the total number of spent voice credits.

    // Hash of all inputs to ensure they are unchanged and authentic.
    signal input inputHash;
    
    // Ballots and their corresponding path elements for verification in the tree.
    signal input ballots[batchSize][BALLOT_LENGTH];
    signal input ballotPathElements[k][TREE_ARITY - 1];
    signal input votes[batchSize][numVoteOptions];

    // Current results for each vote option.
    signal input currentResults[numVoteOptions];
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
    // The number of total registrations, used to validate the batch index.
    signal numSignUps;
    // Index of the first ballot in this batch.
    signal batchStartIndex;

    // Verify sbCommitment.
    var sbCommitmentHash = PoseidonHasher(3)([stateRoot, ballotRoot, sbSalt]);
    sbCommitmentHash === sbCommitment;

    // Verify inputHash.
    var (
        inputHasherNumSignUps,
        inputHasherBatchNum,
        inputHasherHash
    ) = TallyVotesInputHasher()(
        sbCommitment,
        currentTallyCommitment,
        newTallyCommitment,
        packedVals
    );

    inputHash === inputHasherHash;
    numSignUps <== inputHasherNumSignUps;
    batchStartIndex <== inputHasherBatchNum * batchSize;

    // Validates that the batchStartIndex is within the valid range of sign-ups.
    var validNumSignups = LessEqThan(50)([batchStartIndex, numSignUps]);
    validNumSignups === 1;

    // Hashes each ballot for subroot generation, and checks the existence of the leaf in the Merkle tree.    
    var ballotHashers[batchSize];
    
    for (var i = 0; i < batchSize; i++) {
        ballotHashers[i] = PoseidonHasher(2)([ballots[i][BALLOT_NONCE_IDX], ballots[i][BALLOT_VO_ROOT_IDX]]);
    }

    var ballotSubroot = QuinCheckRoot(intStateTreeDepth)(ballotHashers);
    var ballotPathIndices[k] = QuinGeneratePathIndices(k)(inputHasherBatchNum);

    // Verifies each ballot's inclusion within the ballot tree.
    QuinLeafExists(k)(
        ballotSubroot,
        ballotPathIndices,
        ballotPathElements,
        ballotRoot
    );

    // Processes vote options, verifying each against its declared root.
    var voteTree[batchSize];
    for (var i = 0; i < batchSize; i++) {
        voteTree[i] = QuinCheckRoot(voteOptionTreeDepth)(votes[i]);
        voteTree[i] === ballots[i][BALLOT_VO_ROOT_IDX];
    }

    // Calculates new results and spent voice credits based on the current and incoming votes.
    var isFirstBatch = IsZero()(batchStartIndex);
    var iz = IsZero()(isFirstBatch);

    // Tally the new results.
    var resultCalc[numVoteOptions];
    for (var i = 0; i < numVoteOptions; i++) {
        var numsRC[batchSize + 1];
        numsRC[batchSize] = currentResults[i] * iz;
        for (var j = 0; j < batchSize; j++) {
            numsRC[j] = votes[j][i];
        }

        resultCalc[i] = CalculateTotal(batchSize + 1)(numsRC);
    }

    // Tally the new spent voice credit total.
    var numsSVC[batchSize * numVoteOptions + 1];
    numsSVC[batchSize * numVoteOptions] = currentSpentVoiceCreditSubtotal * iz;
    for (var i = 0; i < batchSize; i++) {
        for (var j = 0; j < numVoteOptions; j++) {
            numsSVC[i * numVoteOptions + j] = votes[i][j];
        }
    }

    var newSpentVoiceCreditSubtotal = CalculateTotal(batchSize * numVoteOptions + 1)(numsSVC);

    // Verifies the updated results and spent credits, ensuring consistency and correctness of tally updates.
    ResultCommitmentVerifierNonQv(voteOptionTreeDepth)(
        isFirstBatch,
        currentTallyCommitment,
        newTallyCommitment,
        currentResults,
        currentResultsRootSalt,
        resultCalc,
        newResultsRootSalt,
        currentSpentVoiceCreditSubtotal,
        currentSpentVoiceCreditSubtotalSalt,
        newSpentVoiceCreditSubtotal,
        newSpentVoiceCreditSubtotalSalt        
    );
}

/** 
 * Performs verifications and computations related to current voting results. 
 * Also, computes and outputs a commitment to the new results.
 * This template does not support the Quadratic Voting (QV).
 */
 template ResultCommitmentVerifierNonQv(voteOptionTreeDepth) {
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

    // Compute the commitment to the current results.
    var currentResultsRoot = QuinCheckRoot(voteOptionTreeDepth)(currentResults);

    // Verify currentResultsCommitmentHash.
    var currentResultsCommitmentHash = PoseidonHasher(2)([currentResultsRoot, currentResultsRootSalt]);

    // Compute the commitment to the current spent voice credits.
    var currentSpentVoiceCreditsCommitmentHash = PoseidonHasher(2)([currentSpentVoiceCreditSubtotal, currentSpentVoiceCreditSubtotalSalt]);

    // Commit to the current tally
    var currentTallyCommitmentHasher = PoseidonHasher(2)([currentResultsCommitmentHash, currentSpentVoiceCreditsCommitmentHash]);

    // Check if the current tally commitment is correct only if this is not the first batch.
    // iz.out is 1 if this is not the first batch.
    // iz.out is 0 if this is the first batch.
    var iz = IsZero()(isFirstBatch);

    // hz is 0 if this is the first batch, currentTallyCommitment should be 0 if this is the first batch.
    // hz is 1 if this is not the first batch, currentTallyCommitment should not be 0 if this is the first batch.
    signal hz;
    hz <== iz * currentTallyCommitmentHasher;
    hz === currentTallyCommitment;

    // Compute the root of the new results.
    var newResultsRoot = QuinCheckRoot(voteOptionTreeDepth)(newResults);
    var newResultsCommitmentHash = PoseidonHasher(2)([newResultsRoot, newResultsRootSalt]);

    // Compute the commitment to the new spent voice credits value.
    var newSpentVoiceCreditsCommitmentHash = PoseidonHasher(2)([newSpentVoiceCreditSubtotal, newSpentVoiceCreditSubtotalSalt]);

    // Commit to the new tally.
    var newTallyCommitmentHash = PoseidonHasher(2)([
        newResultsCommitmentHash,
        newSpentVoiceCreditsCommitmentHash
    ]);
    
    newTallyCommitmentHash === newTallyCommitment;
}
