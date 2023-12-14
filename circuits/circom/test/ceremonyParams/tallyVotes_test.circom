pragma circom 2.0.0;
include "../../tallyVotes.circom";

component main {public [inputHash]} = TallyVotes(6, 2, 3);
/*stateTreeDepth,*/
/*intStateTreeDepth,*/
/*voteOptionTreeDepth*/
