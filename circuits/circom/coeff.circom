pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/comparators.circom";
include "./trees/incrementalQuinTree.circom";
include "./trees/calculateTotal.circom";
include "./trees/checkRoot.circom";
include "./hasherSha256.circom";
include "./hasherPoseidon.circom";
include "./unpackElement.circom";

include "./float.circom";

/*
 * calculate coefficients for subsidy formula, batch by batch.
 */
template CoefficientPerBatch (
    coeffTreeDepth,
    intCoeffTreeDepth,
    voteOptionTreeDepth
) {
    assert(voteOptionTreeDepth > 0);
    assert(intCoeffTreeDepth > 0);
    assert(intCoeffTreeDepth < coeffTreeDepth);

    var TREE_ARITY = 5;

    // The number of ballots in this batch
    var batchSize = TREE_ARITY ** intCoeffTreeDepth;
    var numVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    var BALLOT_LENGTH = 2;
    var BALLOT_NONCE_IDX = 0;
    var BALLOT_VO_ROOT_IDX = 1;

    signal input stateRoot;
    signal input ballotRoot;
    signal input ballotTreeRoot1;
    signal input ballotTreeRoot2;
    signal input coeffTreeRoot;

    signal input sbSalt;
    signal input coeffSalt;

    // The public input (inputHash) is the hash of the following:
    signal input sbCommitment;
    signal input coeffCommitment;
    signal input packedVals;
    signal input inputHash; // public

    var k = coeffTreeDepth - intCoeffTreeDepth;

    signal input ballots1[batchSize][BALLOT_LENGTH];
    signal input ballots2[batchSize][BALLOT_LENGTH];
    signal input votes1[batchSize][numVoteOptions];
    signal input votes2[batchSize][numVoteOptions];
    signal input ballotPathElements1[k][TREE_ARITY - 1];
    signal input ballotPathElements2[k][TREE_ARITY - 1];
    signal input coeffPathElements[k][TREE_ARITY - 1];


    //  ----------------------------------------------------------------------- 
    // Verify sbCommitment
    component sbCommitmentHasher = Hasher3();
    sbCommitmentHasher.in[0] <== stateRoot;
    sbCommitmentHasher.in[1] <== ballotRoot;
    sbCommitmentHasher.in[2] <== sbSalt;
    sbCommitmentHasher.hash === sbCommitment;

    //  ----------------------------------------------------------------------- 
    // Verify inputHash
    component inputHasher = CoefficientInputHasher();
    inputHasher.sbCommitment <== sbCommitment;
    inputHasher.coeffCommitment <== coeffCommitment;
    inputHasher.packedVals <== packedVals;
    inputHasher.hash === inputHash;

    signal numCoeffTotal;
    signal batchStartIndex;

    numCoeffTotal <== inputHasher.numCoeffTotal;
    batchStartIndex <== inputHasher.batchNum * batchSize;

    //  ----------------------------------------------------------------------- 
    // Validate batchStartIndex and numCoeffTotal
    // batchStartIndex should be less than numCoeffTotal
    component validNumSignups = LessEqThan(50);
    validNumSignups.in[0] <== batchStartIndex;
    validNumSignups.in[1] <== numCoeffTotal;
    validNumSignups.out === 1;

    //  ----------------------------------------------------------------------- 
    // Verify the ballot trees
    component ballotTreeVerifier1 = BatchMerkleTreeVerifier(coeffTreeDepth, intCoeffTreeDepth, TREE_ARITY); 
    component ballotHashers1[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        ballotHashers1[i] = HashLeftRight();
        ballotHashers1[i].left <== ballots1[i][BALLOT_NONCE_IDX];
        ballotHashers1[i].right <== ballots1[i][BALLOT_VO_ROOT_IDX];
        ballotTreeVerifier1.leaves[i] <== ballotHashers1[i].hash;
    }
    ballotTreeVerifier1.index <== inputHasher.batchNum;
    ballotTreeVerifier1.root <== ballotTreeRoot1;
    for (var i = 0; i < k; i ++) {
        for (var j = 0; j < TREE_ARITY - 1; j ++) {
            ballotTreeVerifier1.pathElements[i][j] <== ballotPathElements1[i][j];
        }
    }

    component ballotTreeVerifier2 = BatchMerkleTreeVerifier(coeffTreeDepth, intCoeffTreeDepth, TREE_ARITY); 
    component ballotHashers2[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        ballotHashers2[i] = HashLeftRight();
        ballotHashers2[i].left <== ballots2[i][BALLOT_NONCE_IDX];
        ballotHashers2[i].right <== ballots2[i][BALLOT_VO_ROOT_IDX];
        ballotTreeVerifier2.leaves[i] <== ballotHashers2[i].hash;
    }
    ballotTreeVerifier2.index <== inputHasher.batchNum;
    ballotTreeVerifier2.root <== ballotTreeRoot1;
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
    // order check


    //  ----------------------------------------------------------------------- 
    // calculate coeff leaves for this batch
    component resultCalc[batchSize];
    for (var i = 0; i < batchSize; i++) {
        resultCalc[i] = CalculateTotal(numVoteOptions);
        for (var j = 0; j < numVoteOptions; j++) {
            resultCalc[i].nums[j] <== votes1[i][j] * votes2[i][j];
        }
    }

    // verify coeffcient calculation for this batch
    component coeffTreeVerifier = BatchMerkleTreeVerifier(coeffTreeDepth, intCoeffTreeDepth, TREE_ARITY); 
    for (var i = 0; i < batchSize; i ++) {
        coeffTreeVerifier.leaves[i] <== resultCalc[i].sum;
    }
    coeffTreeVerifier.index <== inputHasher.batchNum;
    coeffTreeVerifier.root <== coeffTreeRoot;
    for (var i = 0; i < k; i ++) {
        for (var j = 0; j < TREE_ARITY - 1; j ++) {
            coeffTreeVerifier.pathElements[i][j] <== coeffPathElements[i][j];
        }
    }
}

template CoefficientInputHasher() {
    signal input packedVals;
    signal input sbCommitment;
    signal input coeffCommitment;

    signal output numCoeffTotal;
    signal output batchNum;
    signal output hash;

    component unpack = UnpackElement(2);
    unpack.in <== packedVals;
    batchNum <== unpack.out[1];
    numCoeffTotal <== unpack.out[0];

    component hasher = Sha256Hasher3();
    hasher.in[0] <== packedVals;
    hasher.in[1] <== sbCommitment;
    hasher.in[2] <== coeffCommitment;

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
