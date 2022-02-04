pragma circom 2.0.0;
include "../quadVoteTally.circom";

// fullStateTreeDepth,
// intermediateStateTreeDepth,
// voteOptionTreeDepth

component main = QuadVoteTally(4, 2, 2);
