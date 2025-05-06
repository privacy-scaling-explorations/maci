export const STATE_TREE_DEPTH = 10;
export const POLL_STATE_TREE_DEPTH = 10;
export const STATE_TREE_ARITY = 2;
export const STATE_TREE_SUBDEPTH = 2;
export const VOTE_OPTION_TREE_ARITY = 5;
export const MESSAGE_BATCH_SIZE = 20;

/**
 * Supported verification key and voting modes
 */
export enum EMode {
  QV,
  NON_QV,
  FULL,
}
