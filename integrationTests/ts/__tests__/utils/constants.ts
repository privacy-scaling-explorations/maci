// this file contains all of the constants used in the integration tests
export const INVALID_VOTE = {
  voteWeight: 2n,
  nonce: 0n,
  maxVoteWeight: 1n,
  voteCreditBalance: 1n,
};
export const DEFAULT_VOTE = {
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
export const IVCP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const MAX_USERS = 15;
export const MAX_MESSAGES = 25;
export const MAX_VOTE_OPTIONS = 25;
export const INITIAL_VOICE_CREDITS = 1000;
export const COORDINATOR_PRIV_KEY = "2222222222263902553431241761119057960280734584214105336279476766401963593688";
export const MESSAGE_BATCH_SIZE = 4;
export const DURATION = 300;
export const STATE_TREE_DEPTH = 10;
export const INT_STATE_TREE_DEPTH = 1;
export const MSG_TREE_DEPTH = 2;
export const VOTE_OPTION_TREE_DEPTH = 2;
export const MSG_BATCH_DEPTH = 1;

export const VOICE_CREDIT_BALANCE = 100n;
export const MAX_VALUES = {
  maxUsers: 25,
  maxMessages: 25,
  maxVoteOptions: 25,
};
export const TREE_DEPTHS = {
  intStateTreeDepth: 2,
  messageTreeDepth: 2,
  messageTreeSubDepth: 1,
  voteOptionTreeDepth: 2,
};
