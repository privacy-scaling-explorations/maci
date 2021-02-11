include "../node_modules/circomlib/circuits/comparators.circom";
include "./trees/calculateTotal.circom";
include "./trees/checkRoot.circom";

/*
 * Tally votes in the ballots, batch by batch.
 */
template TallyVotes(
    stateTreeDepth,
    intStateTreeDepth,
    voteOptionTreeDepth
) {
    var TREE_ARITY = 5;

    // The number of ballots in this batch
    var batchSize = TREE_ARITY ** intStateTreeDepth;
    var numVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    signal private input batchStartIndex;
    signal private input numSignUps;

    signal input ballotCommitment;
    signal private input ballotRoot;
    signal private input ballotSalt;

    /*signal output newBallotCommitment;*/

    //  ----------------------------------------------------------------------- 
    // 1. Validate variables
    assert(voteOptionTreeDepth > 0);
    assert(intStateTreeDepth < stateTreeDepth);

    //  ----------------------------------------------------------------------- 
    // 2. Validate batchStartIndex and numSignUps
    // batchStartIndex should be less than numSignUps
    component validNumSignups = LessThan(50);
    validNumSignups.in[0] <== batchStartIndex;
    validNumSignups.in[1] <== numSignUps;
    validNumSignups.out === 1;

    //  ----------------------------------------------------------------------- 
    // 2. Validate the ballotCommitment signal
}
