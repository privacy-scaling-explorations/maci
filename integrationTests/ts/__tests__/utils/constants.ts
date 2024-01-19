// this file contains all of the constants used in the integration tests
export const invalidVote = {
  voteWeight: 2n,
  nonce: 0n,
  maxVoteWeight: 1n,
  voteCreditBalance: 1n,
};
export const defaultVote = {
  voteWeight: 1n,
  nonce: 1n,
  maxVoteWeight: 25n,
  voteCreditBalance: 1n,
  voteOptionIndex: 0n,
};
export const SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const QUINARY_HASH_LENGTH = 5;
export const HASH_LENGTH = 2;
export const SUB_DEPTH = 2;
export const PROCESS_DEPTH = 4;
export const LEAVES_PER_NODE = 5;
export const NOTHING_UP_MY_SLEEVE = "8370432830353022751713833565135785980866757267633941821328460903436894336785";
export const ivcpData = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const maxUsers = 15;
export const maxMessages = 25;
export const maxVoteOptions = 25;
export const initialVoiceCredits = 1000;
export const signUpDuration = 120;
export const votingDuration = 120;
export const signUpDurationInSeconds = 3600;
export const votingDurationInSeconds = 3600;
export const coordinatorPrivKey = "2222222222263902553431241761119057960280734584214105336279476766401963593688";
export const messageBatchSize = 4;
export const tallyBatchSize = 4;
export const quadVoteTallyBatchSize = 4;
export const voteOptionsMaxLeafIndex = 3;
export const duration = 300;
export const intStateTreeDepth = 1;
export const messageTreeDepth = 2;
export const messageBatchDepth = 1;
export const STATE_TREE_DEPTH = 10;
export const INT_STATE_TREE_DEPTH = 1;
export const MSG_TREE_DEPTH = 2;
export const VOTE_OPTION_TREE_DEPTH = 2;
export const MSG_BATCH_DEPTH = 1;
