template QuadVoteTally(numVoteOptions, numUsers) {
    // Each element in `voteLeaves` is an array of the square roots of a user's
    // voice credits per option.
    signal input voteLeaves[numUsers][numVoteOptions];

    // Each element in `results` is the sum of the square root of each user's
    // voice credits per option.
    // [x, y] means x for option 0, and y for option 1.
    signal output results[numVoteOptions];

    // Ensure via a constraint that the `stateRoot` is the correct Merkle root
    // of the stateLeaves passed into this snark
    // TODO: verify stateRoot == genTree(stateLeaves)

    // We have to declare j outside the for loops.
    var j;

    var subtotal = 0;

    for (var i = 0; i < numUsers; i++) {
        // Ensure via a constraint that the voteLeaves for this 
        // user is correct (such that when each vote leaf is 
        // inserted into an MT, the Merkle root matches
        // the `voteOptionTreeRoot` field of the state leaf)

        // TODO: verify computedVoteOptionTreeRoot == stateLeaves[i].voteOptionTreeRoot

        // Calculate the sum of votes for each option. Note that we ignore
        // user 0 (leaf 0 of the state tree) which only contains random
        // data
        for (j = 1; j < numVoteOptions; j++) {
            subtotal += voteLeaves[i][j];
        }

        // Output the subtotal
        results[i] <== subtotal;
        subtotal = 0;
    }
}
