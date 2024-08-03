import { Keypair } from "maci-domainobjs";

export const voiceCreditBalance = 100n;
export const duration = 30;
export const messageBatchSize = 5;
export const coordinatorKeypair = new Keypair();

export const treeDepths = {
  intStateTreeDepth: 2,
  messageTreeDepth: 2,
  messageTreeSubDepth: 2,
  voteOptionTreeDepth: 2,
};
