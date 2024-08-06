import { Keypair } from "maci-domainobjs";

export const VOICE_CREDIT_BALANCE = 100n;
export const DURATION = 30;
export const MESSAGE_BATCH_SIZE = 5;
export const COORDINATOR_KEYPAIR = new Keypair();
export const STATE_TREE_DEPTH = 10;

export const TREE_DEPTHS = {
  intStateTreeDepth: 2,
  messageTreeDepth: 2,
  messageTreeSubDepth: 2,
  voteOptionTreeDepth: 2,
};
