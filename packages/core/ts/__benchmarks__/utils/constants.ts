import { Keypair } from "@maci-protocol/domainobjs";

export const VOICE_CREDIT_BALANCE = 100n;
export const DURATION = 30;
export const MESSAGE_BATCH_SIZE = 5;
export const COORDINATOR_KEYPAIR = new Keypair();
export const STATE_TREE_DEPTH = 10;

export const MAX_VALUES = {
  maxUsers: 25,
};

export const TREE_DEPTHS = {
  tallyProcessingStateTreeDepth: 2,
  voteOptionTreeDepth: 4,
  stateTreeDepth: 10,
};
