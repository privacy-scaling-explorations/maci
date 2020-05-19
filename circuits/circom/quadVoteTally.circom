include "../node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./trees/incrementalQuadTree.circom";
include "./hasherPoseidon.circom";
include "./trees/calculateTotal.circom";

// This circuit tallies the votes from a batch of state leaves, and produces an
// intermediate state root. 

// TODO: rename the inputs so that they are more intuitive

template QuadVoteTally(
    // The depth of the full state tree
    fullStateTreeDepth,
    // The depth of the intermediate state tree
    intermediateStateTreeDepth,
    // The depth of the vote option tree
    voteOptionTreeDepth
) {
    var LEAVES_PER_NODE = 5;
    var LEAVES_PER_PATH_LEVEL = LEAVES_PER_NODE - 1;

    // --- BEGIN inputs

    // The state root of the full state tree
    signal input fullStateRoot;

    // numUsers is the size of the current batch of state leaves to process
    var numUsers = LEAVES_PER_NODE ** intermediateStateTreeDepth;

    var k = fullStateTreeDepth - intermediateStateTreeDepth;

    //	The Merkle path elements from `intermediateStateRoot` to `stateRoot`.
    signal private input intermediatePathElements[k][LEAVES_PER_PATH_LEVEL];

    // The Merkle path index from `intermediateStateRoot` to `stateRoot`.
    signal input intermediatePathIndex;

    // The intermediate state root, which is generated from the current batch
    // of state leaves (see `stateLeaves` below)
    signal input intermediateStateRoot;

    // Each element in `currentResults` and `newResults` is the sum of the
    // square root of each user's voice credits per option.
    // [x, y] means x for option 0, and y for option 1.

    var numVoteOptions = LEAVES_PER_NODE ** voteOptionTreeDepth;

    // `currentResults` is the vote tally of all prior batches of state leaves	
    signal private input currentResults[numVoteOptions];

    signal input currentResultsCommitment;
    signal private input currentResultsSalt;

    // `newResults` is the vote tally of this batch of state leaves
    signal output newResultsCommitment;

    // The salt to hash with the computed results in order to produce newResultsCommitment
    signal private input newResultsSalt;

    // The batch of state leaves to tally
    var messageLength = 5;
    signal private input stateLeaves[numUsers][messageLength];

    // Each element in `voteLeaves` is an array of the square roots of a user's
    // voice credits per option.
    signal private input voteLeaves[numUsers][numVoteOptions];

    // --- END inputs

    var STATE_TREE_VOTE_OPTION_TREE_ROOT_IDX = 2;

    // --- BEGIN check the full state root

    var i;
    var j;
    var m;

    // Generate the intermediate path index for Merkle proof verifcation
    component intermediatePathIndices = QuadGeneratePathIndices(k);
    intermediatePathIndices.in <== intermediatePathIndex;

    // Check that the intermediate root is part of the full state tree
    component fullStateRootChecker = QuadLeafExists(k);
    fullStateRootChecker.root <== fullStateRoot; 
    fullStateRootChecker.leaf <== intermediateStateRoot; 
    for (i = 0; i < k; i ++) {
        for (j = 0; j < LEAVES_PER_PATH_LEVEL; j ++) {
            fullStateRootChecker.path_elements[i][j] <== intermediatePathElements[i][j];
        }
        fullStateRootChecker.path_index[i] <== intermediatePathIndices.out[i];
    }

    // --- END

    // --- BEGIN check the intermediate state root

    component stateLeafHashers[numUsers];
    component intermediateStateRootChecker = QuadCheckRoot(intermediateStateTreeDepth);
    component voteOptionRootChecker[numUsers];

    // Instantiate the state leaf checker and vote option root checker
    // components in the same loop
    for (i=0; i < numUsers; i++) {
        voteOptionRootChecker[i] = QuadCheckRoot(voteOptionTreeDepth);
        stateLeafHashers[i] = Hasher5();

        // Hash each state leaf
        for (j=0; j < messageLength; j++) {
            stateLeafHashers[i].in[j] <== stateLeaves[i][j];
        }

        // Calculate the intermediate state root
        intermediateStateRootChecker.leaves[i] <== stateLeafHashers[i].hash;
    }

    // Ensure via a constraint that the `intermediateStateRoot` is the correct
    // Merkle root of the stateLeaves passed into this snark
    intermediateStateRoot === intermediateStateRootChecker.root;

    // --- END

    // --- BEGIN check vote tally and vote option root

    component voteOptionSubtotals[numVoteOptions];

    // Prepare the CalculateTotal components to add up (a) the current vote
    // tally and the votes in `voteLeaves`
    for (i=0; i < numVoteOptions; i++) {
        voteOptionSubtotals[i] = CalculateTotal(numUsers + 1);

        // Add the existing vote tally to the subtotal
        voteOptionSubtotals[i].nums[numUsers] <== currentResults[i];
    }

    // Determine if we should skip leaf 0. This should only be the case if
    // intermediatePathIndex is 0

    // `isZero.out` is 1 only if intermediatePathIndex equals 0
    component isZero = IsZero();
    isZero.in <== intermediatePathIndex;

    // If intermediatePathIndex equals 0, the first leaf should be [0, 0, ...]
    // (just zeros).

    // Otherwise, it should be voteLeaves[0][...]

    component mux[numVoteOptions];
    for (i = 0; i < numVoteOptions; i++) {
        mux[i] = Mux1();

        // The selector.
        mux[i].s <== isZero.out;
        mux[i].c[0] <== voteLeaves[0][i];
        mux[i].c[1] <== 0;

        //`mux.out` returns mux.c[0] if s == 0 and mux.c[1] otherwise
        voteOptionRootChecker[0].leaves[i] <== mux[i].out;
        voteOptionSubtotals[i].nums[0] <== mux[i].out;
    }

    for (i = 1; i < numUsers; i++) {
        //  Note that we ignore user 0 (leaf 0 of the state tree) which
        //  only contains random data

        for (j = 0; j < numVoteOptions; j++) {
            // Ensure that the voteLeaves for this user is correct (such that
            // when each (unhashed) vote leaf is inserted into an MT, the Merkle root
            // matches the `voteOptionTreeRoot` field of the state leaf)

            voteOptionRootChecker[i].leaves[j] <== voteLeaves[i][j];

            // Calculate the sum of votes for each option.
            voteOptionSubtotals[j].nums[i] <== voteLeaves[i][j];
        }

        // Check that the computed vote option tree root matches the
        // corresponding value in the state leaf
        voteOptionRootChecker[i].root === stateLeaves[i][STATE_TREE_VOTE_OPTION_TREE_ROOT_IDX];
    }

    // --- END

    // --- BEGIN verify commitments to results

    component resultCommitmentVerifier = ResultCommitmentVerifier(voteOptionTreeDepth);
    resultCommitmentVerifier.currentResultsSalt <== currentResultsSalt;
    resultCommitmentVerifier.currentResultsCommitment <== currentResultsCommitment;
    resultCommitmentVerifier.newResultsSalt <== newResultsSalt;
    for (i = 0; i < numVoteOptions; i++) {
        resultCommitmentVerifier.newResults[i] <== voteOptionSubtotals[i].sum;
        resultCommitmentVerifier.currentResults[i] <== currentResults[i];
    }

    // Output a commitment to the new results
    newResultsCommitment <== resultCommitmentVerifier.newResultsCommitment;

    // --- END
}

/*
 * Verifies the commitment to the current results. Also computes and outputs a
 * commitment to the new results.
 */
template ResultCommitmentVerifier(voteOptionTreeDepth) {
    var LEAVES_PER_NODE = 5;
    var numVoteOptions = LEAVES_PER_NODE ** voteOptionTreeDepth;

    signal input currentResultsSalt;
    signal input currentResultsCommitment;
    signal input currentResults[numVoteOptions];

    signal input newResultsSalt;
    signal input newResults[numVoteOptions];
    signal output newResultsCommitment;

    // Salt and hash the results up to the current batch
    component currentResultsTree = QuadCheckRoot(voteOptionTreeDepth);
    component newResultsTree = QuadCheckRoot(voteOptionTreeDepth);
    for (var i = 0; i < numVoteOptions; i++) {
        newResultsTree.leaves[i] <== newResults[i];
        currentResultsTree.leaves[i] <== currentResults[i];
    }

    component currentResultsCommitmentHasher = HashLeftRight();
    currentResultsCommitmentHasher.left <== currentResultsTree.root;
    currentResultsCommitmentHasher.right <== currentResultsSalt;

    // Also salt and hash the result of the current batch
    component newResultsCommitmentHasher = HashLeftRight();
    newResultsCommitmentHasher.left <== newResultsTree.root;
    newResultsCommitmentHasher.right <== newResultsSalt;

    // Check if the salted hash of the results up to the current batch is valid
    currentResultsCommitment === currentResultsCommitmentHasher.hash;

    newResultsCommitment <== newResultsCommitmentHasher.hash;
}
