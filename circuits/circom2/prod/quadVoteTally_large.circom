include "../quadVoteTally.circom";

// fullStateTreeDepth,
// intermediateStateTreeDepth,
// voteOptionTreeDepth
// 4096 users, 32768 messages, and 125 vote options

component main = QuadVoteTally(12, 2, 3);
