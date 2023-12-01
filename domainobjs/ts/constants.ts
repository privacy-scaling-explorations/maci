import { StateLeaf } from "./stateLeaf";

export const SERIALIZED_PRIV_KEY_PREFIX = "macisk.";
export const SERIALIZED_PUB_KEY_PREFIX = "macipk.";
export const blankStateLeaf = StateLeaf.genBlankLeaf();
export const blankStateLeafHash = blankStateLeaf.hash();
