pragma circom 2.0.0;
include "../trees/incrementalQuinTree.circom"

component main {public [leaf, root]} = QuinLeafExists(3);
