include "../node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkletree.circom";
include "./hasher.circom";

// This circuit returns the sum of the two inputs
template Add() {
    signal input first;
    signal input second;
    signal output sum;

    sum <== first + second;

    // TODO: should we also do range checks here? e.g. first <= sum and second <= sum?
}

// This circuit returns the sum of the inputs.
// n must be greater than 0.
template CalculateTotal(n) {
    signal input nums[n];
    signal output sum;

    component adders[n];
    adders[0] = Add();
    adders[0].first <== 0;
    adders[0].second <== nums[0];
    for (var i=1; i < n; i++) {
        adders[i] = Add();
        adders[i].first <== adders[i-1].sum;
        adders[i].second <== nums[i];
    }
    sum <== adders[n - 1].sum;
}

// This circuit tallies the votes from a batch of state leaves, and produces an
// intermediate state root. 
// TODO: break this circuit up in to smaller ones
template QuadVoteTally(
    // The depth of the full state tree
    fullStateTreeDepth,
    // The depth of the intermediate state tree
    intermediateStateTreeDepth,
    // The depth of the vote option tree
    voteOptionTreeDepth
) {

    // --- BEGIN inputs

    // The state root of the full state tree
    signal input fullStateRoot;

    // numUsers is the size of the current batch of state leaves to process
    var numUsers = 2 ** intermediateStateTreeDepth;

    var k = fullStateTreeDepth - intermediateStateTreeDepth;

    //	The Merkle path elements from `intermediateStateRoot` to `stateRoot`.
    signal input intermediatePathElements[k];

    // The Merkle path index from `intermediateStateRoot` to `stateRoot`.
    signal input intermediatePathIndex;

    // The intermediate state root, which is generated from the current batch
    // of state leaves (see `stateLeaves` below)
    signal input intermediateStateRoot;

    // Each element in `currentResults` and `newResults` is the sum of the
    // square root of each user's voice credits per option.
    // [x, y] means x for option 0, and y for option 1.

    var numVoteOptions = 2 ** voteOptionTreeDepth;
    // `currentResults` is the vote tally of all prior batches of state leaves	
    signal output currentResults[numVoteOptions];

    /*// `newResults` is the vote tally of this batch of state leaves*/
    signal output newResults[numVoteOptions];

    // The batch of state leaves to tally
    var messageLength = 5;
    signal private input stateLeaves[numUsers][messageLength];

    // Each element in `voteLeaves` is an array of the square roots of a user's
    // voice credits per option.
    signal input voteLeaves[numUsers][numVoteOptions];

    // --- END inputs

    // --- BEGIN check the intermediate state root

    var i;
    var j;

    component intermediatePathIndexBits = Num2Bits_strict();
    intermediatePathIndexBits.in <== intermediatePathIndex;

    // Check that the intermediate root is part of the full state tree
    component fullStateRootChecker = LeafExists(k);
    fullStateRootChecker.root <== fullStateRoot; 
    fullStateRootChecker.leaf <== intermediateStateRoot; 
    for (i=0; i < k; i++) {
        fullStateRootChecker.path_elements[i] <== intermediatePathElements[i];
        fullStateRootChecker.path_index[i] <== intermediatePathIndexBits.out[i];
    }

    component stateLeafHashers[numUsers];
    component intermediateStateRootChecker = CheckRoot(intermediateStateTreeDepth);
    component voteOptionRootChecker[numUsers];

    // Instantiate the state leaf checker and vote option root checker
    // components in the same loop
    for (i=0; i < numUsers; i++) {
        voteOptionRootChecker[i] = CheckRoot(voteOptionTreeDepth);
        stateLeafHashers[i] = Hasher(messageLength);
        stateLeafHashers[i].key <== 0;

        // Hash each state leaf
        for (j=0; j < messageLength; j++) {
            stateLeafHashers[i].in[j] <== stateLeaves[i][j];
        }

        // Calculate the intermediate state root
        intermediateStateRootChecker.leaves[i] <== stateLeafHashers[i].hash;
    }

    // Ensure via a constraint that the `intermediateStateRoot` is the correct
    // Merkle root of the stateLeaves passed into this snark
    intermediateStateRoot <== intermediateStateRootChecker.root;

    // --- END

    // --- BEGIN check vote tally and vote option root

    // Prepare the CalculateTotal components to add up (a) the current vote
    // tally and the votes in `voteLeaves`

    component voteOptionSubtotals[numVoteOptions];

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
    var start = isZero.out;

    // If intermediatePathIndex equals 0, the first leaf should be [0, 0, ...].
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

    for (i = start; i < numUsers; i++) {
        //  Note that we ignore user 0 (leaf 0 of the state tree) which
        //  only contains random data

        for (j = 0; j < numVoteOptions; j++) {
            // Ensure that the voteLeaves for this user is correct (such that
            // when each vote leaf is inserted into an MT, the Merkle root
            // matches the `voteOptionTreeRoot` field of the state leaf)
            voteOptionRootChecker[i].leaves[j] <== voteLeaves[i][j];

            // Calculate the sum of votes for each option.
            voteOptionSubtotals[j].nums[i] <== voteLeaves[i][j];
        }

        // Check that the computed vote option tree root matches the
        // corresponding value in the state leaf
        voteOptionRootChecker[i].root === stateLeaves[i][2];
    }

    for (i = 0; i < numVoteOptions; i++) {
        newResults[i] <== voteOptionSubtotals[i].sum;
    }
}
