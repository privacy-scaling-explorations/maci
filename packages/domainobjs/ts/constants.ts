import { PublicKey } from "./publicKey";
import { StateLeaf } from "./stateLeaf";

export const blankStateLeaf = StateLeaf.generateBlank();
export const blankStateLeafHash = blankStateLeaf.hash();
export const padKey = PublicKey.generatePaddingKey();
