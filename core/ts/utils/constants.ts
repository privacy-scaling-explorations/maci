import { StateLeaf } from "maci-domainobjs";

const STATE_TREE_DEPTH = 10;
const STATE_TREE_ARITY = 5;
const STATE_TREE_SUBDEPTH = 2;
const MESSAGE_TREE_ARITY = 5;
const VOTE_OPTION_TREE_ARITY = 5;

// todo: organize this in domainobjs
const BlankStateLeaf: StateLeaf = StateLeaf.genBlankLeaf();
const BlankStateLeafHash: bigint = BlankStateLeaf.hash();

export {
  STATE_TREE_DEPTH,
  STATE_TREE_ARITY,
  STATE_TREE_SUBDEPTH,
  MESSAGE_TREE_ARITY,
  VOTE_OPTION_TREE_ARITY,
  BlankStateLeaf,
  BlankStateLeafHash,
};
