import { Keypair } from "@maci-protocol/domainobjs";

import { VOTE_OPTION_TREE_ARITY } from "../../utils/constants";

export const voiceCreditBalance = 100n;
export const duration = 30;
export const messageBatchSize = 20;
export const coordinatorKeypair = new Keypair();
export const treeDepths = {
  tallyProcessingStateTreeDepth: 2,
  voteOptionTreeDepth: 4,
  stateTreeDepth: 10,
};
export const maxVoteOptions = BigInt(VOTE_OPTION_TREE_ARITY ** treeDepths.voteOptionTreeDepth);
