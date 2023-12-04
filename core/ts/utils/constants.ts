import { StateLeaf } from "maci-domainobjs";

const STATE_TREE_ARITY = 5;
const STATE_TREE_SUBDEPTH = 2;

// todo: organize this in domainobjs
const BlankStateLeaf = StateLeaf.genBlankLeaf();
const BlankStateLeafHash = BlankStateLeaf.hash();

export { STATE_TREE_ARITY, STATE_TREE_SUBDEPTH, BlankStateLeaf, BlankStateLeafHash };
