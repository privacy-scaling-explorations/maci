import { Keypair } from "maci-domainobjs";

export const voiceCreditBalance = 100n;
export const duration = 30;
export const messageBatchSize = 25;
export const coordinatorKeypair = new Keypair();
export const maxValues = {
  maxUsers: 25,
  maxMessages: 25,
  maxVoteOptions: 25,
};

export const treeDepths = {
  intStateTreeDepth: 2,
  messageTreeDepth: 3,
  messageTreeSubDepth: 2,
  voteOptionTreeDepth: 4,
};
