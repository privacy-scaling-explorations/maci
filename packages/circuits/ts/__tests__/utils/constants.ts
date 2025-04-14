import { VOTE_OPTION_TREE_ARITY } from "@maci-protocol/core";

export const STATE_TREE_DEPTH = 10;
export const voiceCreditBalance = BigInt(100);
export const duration = 30;

export const treeDepths = {
  intStateTreeDepth: 5,
  voteOptionTreeDepth: 2,
  stateTreeDepth: 10,
};

export const messageBatchSize = 20;

export const maxVoteOptions = BigInt(VOTE_OPTION_TREE_ARITY ** treeDepths.voteOptionTreeDepth);

export const L = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;
