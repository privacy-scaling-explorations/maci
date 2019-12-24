template Adder(n) {
    signal input nums[n];
    signal output result;
    var total = 0;
    var i;
    for (i = 0; i < n; i++) {
        total += nums[i];
    }
    result <== total;
}

template QuadVoteTally(numVoteOptions, numUsers) {
    signal output results[numVoteOptions];
    signal input voteLeaves[numUsers][numVoteOptions];

    component adders[numVoteOptions];

    var i;
    var j;

    for (i = 0; i < numVoteOptions; i++) {
        adders[i] = Adder(numUsers - 1);
        for (j = 1; j < numUsers; j++) {
            adders[i].nums[j-1] <== voteLeaves[j][i];
        }
        results[i] <== adders[i].result;
    }

    /*** Is the above or below safer?

    var subtotal = 0;
    for (i = 0; i < numVoteOptions; i++) {
        for (j = 1; j < numUsers; j++) {
            subtotal += voteLeaves[j][i];
        }
        results[i] <== subtotal;
        subtotal = 0;
    }
    */
}
