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
include "./float.circom";

/*
 * calculate subsidy, batch by batch.
 */
template SubsidyPerBatch (
    stateTreeDepth,
    intStateTreeDepth,
    voteOptionTreeDepth
) {
    // keep MM < 2 ** 196 to avoid overflow: https://hackmd.io/@chaosma/H1_9xmT2K
    var MM = 50; // protocol params should be consistent with MaciState.ts
    var WW = 4; // number of decimal in float representation, should consist with MaciState.ts
    var NN = 64; // maximum width of bits (10**NN < 2**253) in float division
    assert(voteOptionTreeDepth > 0);
    assert(intStateTreeDepth > 0);
    assert(intStateTreeDepth < stateTreeDepth);

    var TREE_ARITY = 5;

    // The number of ballots in this batch
    var batchSize = TREE_ARITY ** intStateTreeDepth; // consistent with MaciState.ts
    var numVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    var BALLOT_LENGTH = 2;
    var BALLOT_NONCE_IDX = 0;
    var BALLOT_VO_ROOT_IDX = 1;

    signal input stateRoot;
    signal input ballotRoot;

    signal input sbSalt;
    signal input currentSubsidySalt;
    signal input newSubsidySalt;

    // The public input (inputHash) is the hash of the following:
    signal input sbCommitment;
    signal input currentSubsidyCommitment;
    signal input newSubsidyCommitment;
    signal input packedVals;
    signal input inputHash; // public

    var k = stateTreeDepth - intStateTreeDepth;

    signal input ballots1[batchSize][BALLOT_LENGTH];
    signal input ballots2[batchSize][BALLOT_LENGTH];
    signal input votes1[batchSize][numVoteOptions];
    signal input votes2[batchSize][numVoteOptions];
    signal input ballotPathElements1[k][TREE_ARITY - 1];
    signal input ballotPathElements2[k][TREE_ARITY - 1];
    signal input currentSubsidy[numVoteOptions];


    //  ----------------------------------------------------------------------- 
    // Verify sbCommitment
    component sbCommitmentHasher = Hasher3();
    sbCommitmentHasher.in[0] <== stateRoot;
    sbCommitmentHasher.in[1] <== ballotRoot;
    sbCommitmentHasher.in[2] <== sbSalt;
    sbCommitmentHasher.hash === sbCommitment;

    //  ----------------------------------------------------------------------- 
    // Verify inputHash
    component inputHasher = SubsidyInputHasher();
    inputHasher.sbCommitment <== sbCommitment;
    inputHasher.currentSubsidyCommitment <== currentSubsidyCommitment;
    inputHasher.newSubsidyCommitment <== newSubsidyCommitment;
    inputHasher.packedVals <== packedVals;
    inputHasher.hash === inputHash;

    //  ----------------------------------------------------------------------- 
    // Validate rowStartIndex and colStartIndex
    // they should be less than numSignUps 
    signal numSignUps;
    signal rowStartIndex;
    signal colStartIndex;

    numSignUps <== inputHasher.numSignUps;
    rowStartIndex <== inputHasher.rbi * batchSize;
    colStartIndex <== inputHasher.cbi * batchSize;

    component validRowIndex = LessEqThan(50);
    validRowIndex.in[0] <== rowStartIndex;
    validRowIndex.in[1] <== numSignUps;
    validRowIndex.out === 1;

    component validColIndex = LessEqThan(50);
    validColIndex.in[0] <== colStartIndex;
    validColIndex.in[1] <== numSignUps;
    validColIndex.out === 1;

    //  ----------------------------------------------------------------------- 
    // Verify both batches belong to the ballot tree
    component ballotTreeVerifier1 = BatchMerkleTreeVerifier(stateTreeDepth, intStateTreeDepth, TREE_ARITY); 
    component ballotHashers1[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        ballotHashers1[i] = HashLeftRight();
        ballotHashers1[i].left <== ballots1[i][BALLOT_NONCE_IDX];
        ballotHashers1[i].right <== ballots1[i][BALLOT_VO_ROOT_IDX];
        ballotTreeVerifier1.leaves[i] <== ballotHashers1[i].hash;
    }
    ballotTreeVerifier1.index <== inputHasher.rbi;
    ballotTreeVerifier1.root <== ballotRoot;
    for (var i = 0; i < k; i ++) {
        for (var j = 0; j < TREE_ARITY - 1; j ++) {
            ballotTreeVerifier1.pathElements[i][j] <== ballotPathElements1[i][j];
        }
    }

    component ballotTreeVerifier2 = BatchMerkleTreeVerifier(stateTreeDepth, intStateTreeDepth, TREE_ARITY); 
    component ballotHashers2[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        ballotHashers2[i] = HashLeftRight();
        ballotHashers2[i].left <== ballots2[i][BALLOT_NONCE_IDX];
        ballotHashers2[i].right <== ballots2[i][BALLOT_VO_ROOT_IDX];
        ballotTreeVerifier2.leaves[i] <== ballotHashers2[i].hash;
    }
    ballotTreeVerifier2.index <== inputHasher.cbi;
    ballotTreeVerifier2.root <== ballotRoot;
    for (var i = 0; i < k; i ++) {
        for (var j = 0; j < TREE_ARITY - 1; j ++) {
            ballotTreeVerifier2.pathElements[i][j] <== ballotPathElements2[i][j];
        }
    }


    //  ----------------------------------------------------------------------- 
    // Verify the vote option roots
    component voteTree1[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        voteTree1[i] = QuinCheckRoot(voteOptionTreeDepth);
        for (var j = 0; j < TREE_ARITY ** voteOptionTreeDepth; j ++) {
            voteTree1[i].leaves[j] <== votes1[i][j];
        }
        voteTree1[i].root === ballots1[i][BALLOT_VO_ROOT_IDX];
    }
    component voteTree2[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        voteTree2[i] = QuinCheckRoot(voteOptionTreeDepth);
        for (var j = 0; j < TREE_ARITY ** voteOptionTreeDepth; j ++) {
            voteTree2[i].leaves[j] <== votes2[i][j];
        }
        voteTree2[i].root === ballots2[i][BALLOT_VO_ROOT_IDX];
    }


    //  ----------------------------------------------------------------------- 
    // calculate coefficients for this batch
    signal vsquares[batchSize*batchSize][numVoteOptions];
    component tmp[batchSize*batchSize];
    component kij[batchSize*batchSize];
    var idx = 0;
    for (var i = 0; i < batchSize; i ++) {
        for (var j = 0; j < batchSize; j ++) {
            tmp[idx] = CalculateTotal(numVoteOptions);
            kij[idx] = DivisionFromNormal(WW,NN);
            for (var p = 0; p < numVoteOptions; p++) {
                vsquares[idx][p] <== votes1[i][p] * votes2[j][p];
                tmp[idx].nums[p] <== vsquares[idx][p];
            }
            kij[idx].a <== MM;
            kij[idx].b <== MM + tmp[idx].sum;
            idx++;
        }
    }

    // calculate subsidy for this batch
    component isFirstBatch = IsZero();
    isFirstBatch.in <== rowStartIndex + colStartIndex;
    
    component iz = IsZero();
    iz.in <== isFirstBatch.out;
    component isDiag = IsZero();
    isDiag.in <== rowStartIndex - colStartIndex;
    signal lower[batchSize*(batchSize+1)/2][numVoteOptions]; 

    component subsidy1[numVoteOptions];
    component subsidy2[numVoteOptions];

    for (var p = 0; p < numVoteOptions; p ++) {
        subsidy1[p] = CalculateTotal(batchSize * (batchSize-1)/2 + 1);
        subsidy2[p] = CalculateTotal(batchSize * (batchSize+1)/2);

        // upper triangle of coefficients matrix
        var cnt1 = 0;
        subsidy1[p].nums[batchSize * (batchSize-1)/2] <== currentSubsidy[p] * iz.out;
        for (var i = 0; i < batchSize; i++) {
            for (var j = i+1; j < batchSize; j ++) {
                var idx = i * batchSize + j;
                subsidy1[p].nums[cnt1] <== 2 * kij[idx].c * vsquares[idx][p];
                cnt1++;
            }
        }

        // lower half of coefficients matrix
        var cnt2 = 0;
        for (var i = 0; i < batchSize; i++) {
            for (var j = 0; j <= i; j++) {
                var idx = i * batchSize + j;
                lower[cnt2][p] <== 2 * kij[idx].c * vsquares[idx][p]; 
                subsidy2[p].nums[cnt2] <== lower[cnt2][p] * (1 - isDiag.out);
                cnt2++;
            }
        }
    }

    // Verify the current and new subsidy results
    component rcv = SubsidyCommitmentVerifier(voteOptionTreeDepth);
    rcv.isFirstBatch <== isFirstBatch.out;
    rcv.currentSubsidyCommitment <== currentSubsidyCommitment;
    rcv.newSubsidyCommitment <== newSubsidyCommitment;
    rcv.currentSubsidySalt <== currentSubsidySalt;
    rcv.newSubsidySalt <== newSubsidySalt;

    for (var i = 0; i < numVoteOptions; i ++) {
        rcv.currentSubsidy[i] <== currentSubsidy[i];
        rcv.newSubsidy[i] <== subsidy1[i].sum + subsidy2[i].sum; 
    }

    /*
    signal output res[numVoteOptions];
    for (var i = 0; i < numVoteOptions; i++) {
        res[i] <== rcv.newSubsidy[i];
    } */

}

/*
 * Verifies the commitment to the current results. Also computes and outputs a
 * commitment to the new results.
 */
template SubsidyCommitmentVerifier(voteOptionTreeDepth) {
    var TREE_ARITY = 5;
    var numVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    // 1 if this is the first batch, and 0 otherwise
    signal input isFirstBatch;
    signal input currentSubsidyCommitment;
    signal input newSubsidyCommitment;

    // Results
    signal input currentSubsidy[numVoteOptions];
    signal input currentSubsidySalt;

    signal input newSubsidy[numVoteOptions];
    signal input newSubsidySalt;

    // Compute the commitment to the current results
    component currentResultsRoot = QuinCheckRoot(voteOptionTreeDepth);
    for (var i = 0; i < numVoteOptions; i ++) {
        currentResultsRoot.leaves[i] <== currentSubsidy[i];
    }

    component currentResultsCommitment = HashLeftRight();
    currentResultsCommitment.left <== currentResultsRoot.root;
    currentResultsCommitment.right <== currentSubsidySalt;

    // Check if the current tally commitment is correct only if this is not the first batch
    component iz = IsZero();
    iz.in <== isFirstBatch;
    // iz.out is 1 if this is not the first batch
    // iz.out is 0 if this is the first batch

    // hz is 0 if this is the first batch
    // currentSubsidyCommitment should be 0 if this is the first batch

    // hz is 1 if this is not the first batch
    // currentTallyCommitment should not be 0 if this is the first batch
    signal hz;
    hz <== iz.out * currentResultsCommitment.hash;
    hz === currentSubsidyCommitment;

    // Compute the root of the new results
    component newResultsRoot = QuinCheckRoot(voteOptionTreeDepth);
    for (var i = 0; i < numVoteOptions; i ++) {
        newResultsRoot.leaves[i] <== newSubsidy[i];
    }

    component newResultsCommitment = HashLeftRight();
    newResultsCommitment.left <== newResultsRoot.root;
    newResultsCommitment.right <== newSubsidySalt;
    newResultsCommitment.hash === newSubsidyCommitment;
}



template SubsidyInputHasher() {
    signal input packedVals;
    signal input sbCommitment;
    signal input currentSubsidyCommitment;
    signal input newSubsidyCommitment;

    signal output numSignUps;
    signal output rbi;
    signal output cbi;
    signal output hash;

    component unpack = UnpackElement(3);
    unpack.in <== packedVals;
    numSignUps <== unpack.out[0];
    rbi <== unpack.out[1];
    cbi <== unpack.out[2];

    component hasher = Sha256Hasher4();
    hasher.in[0] <== packedVals;
    hasher.in[1] <== sbCommitment;
    hasher.in[2] <== currentSubsidyCommitment;
    hasher.in[3] <== newSubsidyCommitment;

    hash <== hasher.hash;
}

template BatchMerkleTreeVerifier(coeffTreeDepth, intCoeffTreeDepth, TREE_ARITY) {
    var batchSize = TREE_ARITY ** intCoeffTreeDepth;
    // Hash each leaf of the batch and generate the subroot 
    var k = coeffTreeDepth - intCoeffTreeDepth;
    signal input leaves[batchSize];
    signal input pathElements[k][TREE_ARITY - 1];
    signal input root;
    signal input index;
    component ballotSubroot = QuinCheckRoot(intCoeffTreeDepth);
    for (var i = 0; i < batchSize; i ++) {
        ballotSubroot.leaves[i] <== leaves[i];
    }

    component ballotQle = QuinLeafExists(k);
    component upperTreePathIndices = QuinGeneratePathIndices(k);
    upperTreePathIndices.in <== index; 
    ballotQle.leaf <== ballotSubroot.root;
    ballotQle.root <== root;
    for (var i = 0; i < k; i ++) {
        ballotQle.path_index[i] <== upperTreePathIndices.out[i];
        for (var j = 0; j < TREE_ARITY - 1; j ++) {
            ballotQle.path_elements[i][j] <== pathElements[i][j];
        }
    }
}
