include "../batchUpdateStateTree.circom";

// state_tree_depth,
// message_tree_depth,
// vote_options_tree_depth,
// batch_size

// 4096 users, 32768 messages, and 125 vote options

component main = BatchUpdateStateTree(12, 15, 3, 8);
