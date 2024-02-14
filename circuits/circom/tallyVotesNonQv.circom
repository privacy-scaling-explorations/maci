pragma circom 2.0.0;

// circomlib import
include "./comparators.circom";

// local imports
include "./trees/incrementalQuinTree.circom";
include "./trees/calculateTotal.circom";
include "./trees/checkRoot.circom";
include "./hasherSha256.circom";
include "./hasherPoseidon.circom";
include "./unpackElement.circom";
include "./tallyVotes.circom";

// Tally votes in the ballots, batch by batch.
template TallyVotesNonQv(
    stateTreeDepth,
    intStateTreeDepth,
    voteOptionTreeDepth
) {
    assert(voteOptionTreeDepth > 0);
    assert(intStateTreeDepth > 0);
    assert(intStateTreeDepth < stateTreeDepth);

    var TREE_ARITY = 5;

    // The number of ballots in this batch
    var batchSize = TREE_ARITY ** intStateTreeDepth;
    var numVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    var BALLOT_LENGTH = 2;
    var BALLOT_NONCE_IDX = 0;
    var BALLOT_VO_ROOT_IDX = 1;

    signal input stateRoot;
    signal input ballotRoot;
    signal input sbSalt;

    // The only public input (inputHash) is the hash of the following:
    signal input packedVals;
    signal input sbCommitment;
    signal input currentTallyCommitment;
    signal input newTallyCommitment;
    
    // A tally commitment is the hash of the following salted values:
    //   - the vote results
    //   - the number of voice credits spent per vote option
    //   - the total number of spent voice credits

    signal input inputHash;

    var k = stateTreeDepth - intStateTreeDepth;
    // The ballots
    signal input ballots[batchSize][BALLOT_LENGTH];
    signal input ballotPathElements[k][TREE_ARITY - 1];
    signal input votes[batchSize][numVoteOptions];

    signal input currentResults[numVoteOptions];
    signal input currentResultsRootSalt;

    signal input currentSpentVoiceCreditSubtotal;
    signal input currentSpentVoiceCreditSubtotalSalt;

    signal input newResultsRootSalt;
    signal input newSpentVoiceCreditSubtotalSalt;

    //  ----------------------------------------------------------------------- 
    // Verify sbCommitment
    component sbCommitmentHasher = Hasher3();
    sbCommitmentHasher.in[0] <== stateRoot;
    sbCommitmentHasher.in[1] <== ballotRoot;
    sbCommitmentHasher.in[2] <== sbSalt;
    sbCommitmentHasher.hash === sbCommitment;

    //  ----------------------------------------------------------------------- 
    // Verify inputHash
    component inputHasher = TallyVotesInputHasher();
    inputHasher.sbCommitment <== sbCommitment;
    inputHasher.currentTallyCommitment <== currentTallyCommitment;
    inputHasher.newTallyCommitment <== newTallyCommitment;
    inputHasher.packedVals <== packedVals;
    inputHasher.hash === inputHash;

    signal numSignUps;
    signal batchStartIndex;

    numSignUps <== inputHasher.numSignUps;
    batchStartIndex <== inputHasher.batchNum * batchSize;

    //  ----------------------------------------------------------------------- 
    // Validate batchStartIndex and numSignUps
    // batchStartIndex should be less than numSignUps
    component validNumSignups = LessEqThan(50);
    validNumSignups.in[0] <== batchStartIndex;
    validNumSignups.in[1] <== numSignUps;
    validNumSignups.out === 1;

    //  ----------------------------------------------------------------------- 
    // Verify the ballots

    // Hash each ballot and generate the subroot of the ballots
    component ballotSubroot = QuinCheckRoot(intStateTreeDepth);
    component ballotHashers[batchSize];
    for (var i = 0; i < batchSize; i++) {
        ballotHashers[i] = HashLeftRight();
        ballotHashers[i].left <== ballots[i][BALLOT_NONCE_IDX];
        ballotHashers[i].right <== ballots[i][BALLOT_VO_ROOT_IDX];

        ballotSubroot.leaves[i] <== ballotHashers[i].hash;
    }

    component ballotQle = QuinLeafExists(k);
    component ballotPathIndices = QuinGeneratePathIndices(k);
    ballotPathIndices.in <== inputHasher.batchNum;
    ballotQle.leaf <== ballotSubroot.root;
    ballotQle.root <== ballotRoot;
    for (var i = 0; i < k; i++) {
        ballotQle.path_index[i] <== ballotPathIndices.out[i];
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            ballotQle.path_elements[i][j] <== ballotPathElements[i][j];
        }
    }

    //  ----------------------------------------------------------------------- 
    // Verify the vote option roots
    component voteTree[batchSize];
    for (var i = 0; i < batchSize; i++) {
        voteTree[i] = QuinCheckRoot(voteOptionTreeDepth);
        for (var j = 0; j < TREE_ARITY ** voteOptionTreeDepth; j++) {
            voteTree[i].leaves[j] <== votes[i][j];
        }
        voteTree[i].root === ballots[i][BALLOT_VO_ROOT_IDX];
    }

    component isFirstBatch = IsZero();
    isFirstBatch.in <== batchStartIndex;
    
    component iz = IsZero();
    iz.in <== isFirstBatch.out;

    //  ----------------------------------------------------------------------- 
    // Tally the new results
    component resultCalc[numVoteOptions];
    for (var i = 0; i < numVoteOptions; i++) {
        resultCalc[i] = CalculateTotal(batchSize + 1);
        resultCalc[i].nums[batchSize] <== currentResults[i] * iz.out;
        for (var j = 0; j < batchSize; j++) {
            resultCalc[i].nums[j] <== votes[j][i];
        }
    }

    // Tally the new total of spent voice credits
    component newSpentVoiceCreditSubtotal = CalculateTotal(batchSize * numVoteOptions + 1);
    newSpentVoiceCreditSubtotal.nums[batchSize * numVoteOptions] <== currentSpentVoiceCreditSubtotal * iz.out;
    for (var i = 0; i < batchSize; i++) {
        for (var j = 0; j < numVoteOptions; j++) {
            newSpentVoiceCreditSubtotal.nums[i * numVoteOptions + j] <==
                votes[i][j];
        }
    }

    // Verify the current and new tally
    component rcv = ResultCommitmentNonQvVerifier(voteOptionTreeDepth);
    rcv.isFirstBatch <== isFirstBatch.out;
    rcv.currentTallyCommitment <== currentTallyCommitment;
    rcv.newTallyCommitment <== newTallyCommitment;
    rcv.currentResultsRootSalt <== currentResultsRootSalt;
    rcv.newResultsRootSalt <== newResultsRootSalt;
    rcv.currentSpentVoiceCreditSubtotal <== currentSpentVoiceCreditSubtotal;
    rcv.currentSpentVoiceCreditSubtotalSalt <== currentSpentVoiceCreditSubtotalSalt;
    rcv.newSpentVoiceCreditSubtotal <== newSpentVoiceCreditSubtotal.sum;
    rcv.newSpentVoiceCreditSubtotalSalt <== newSpentVoiceCreditSubtotalSalt;

    for (var i = 0; i < numVoteOptions; i++) {
        rcv.currentResults[i] <== currentResults[i];
        rcv.newResults[i] <== resultCalc[i].sum;
    }
}

// Verifies the commitment to the current results. Also computes and outputs a
// commitment to the new results. Works for non quadratic voting 
// - so no need for perVOSpentCredits as they would just match 
// the results.
template ResultCommitmentNonQvVerifier(voteOptionTreeDepth) {
    var TREE_ARITY = 5;
    var numVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    // 1 if this is the first batch, and 0 otherwise
    signal input isFirstBatch;
    signal input currentTallyCommitment;
    signal input newTallyCommitment;

    // Results
    signal input currentResults[numVoteOptions];
    signal input currentResultsRootSalt;

    signal input newResults[numVoteOptions];
    signal input newResultsRootSalt;

    // Spent voice credits
    signal input currentSpentVoiceCreditSubtotal;
    signal input currentSpentVoiceCreditSubtotalSalt;

    signal input newSpentVoiceCreditSubtotal;
    signal input newSpentVoiceCreditSubtotalSalt;

    // Compute the commitment to the current results
    component currentResultsRoot = QuinCheckRoot(voteOptionTreeDepth);
    for (var i = 0; i < numVoteOptions; i++) {
        currentResultsRoot.leaves[i] <== currentResults[i];
    }

    component currentResultsCommitment = HashLeftRight();
    currentResultsCommitment.left <== currentResultsRoot.root;
    currentResultsCommitment.right <== currentResultsRootSalt;

    // Compute the commitment to the current spent voice credits
    component currentSpentVoiceCreditsCommitment = HashLeftRight();
    currentSpentVoiceCreditsCommitment.left <== currentSpentVoiceCreditSubtotal;
    currentSpentVoiceCreditsCommitment.right <== currentSpentVoiceCreditSubtotalSalt;

    // Commit to the current tally
    component currentTallyCommitmentHasher = HashLeftRight();
    currentTallyCommitmentHasher.left <== currentResultsCommitment.hash;
    currentTallyCommitmentHasher.right <== currentSpentVoiceCreditsCommitment.hash;

    // Check if the current tally commitment is correct only if this is not the first batch
    component iz = IsZero();
    iz.in <== isFirstBatch;
    // iz.out is 1 if this is not the first batch
    // iz.out is 0 if this is the first batch

    // hz is 0 if this is the first batch
    // currentTallyCommitment should be 0 if this is the first batch

    // hz is 1 if this is not the first batch
    // currentTallyCommitment should not be 0 if this is the first batch
    signal hz;
    hz <== iz.out * currentTallyCommitmentHasher.hash;

    hz === currentTallyCommitment;

    // Compute the root of the new results
    component newResultsRoot = QuinCheckRoot(voteOptionTreeDepth);
    for (var i = 0; i < numVoteOptions; i++) {
        newResultsRoot.leaves[i] <== newResults[i];
    }

    component newResultsCommitment = HashLeftRight();
    newResultsCommitment.left <== newResultsRoot.root;
    newResultsCommitment.right <== newResultsRootSalt;

    // Compute the commitment to the new spent voice credits value
    component newSpentVoiceCreditsCommitment = HashLeftRight();
    newSpentVoiceCreditsCommitment.left <== newSpentVoiceCreditSubtotal;
    newSpentVoiceCreditsCommitment.right <== newSpentVoiceCreditSubtotalSalt;

    // Commit to the new tally
    component newTallyCommitmentHasher = HashLeftRight();
    newTallyCommitmentHasher.left <== newResultsCommitment.hash;
    newTallyCommitmentHasher.right <== newSpentVoiceCreditsCommitment.hash;

    newTallyCommitmentHasher.hash === newTallyCommitment;
}
