pragma circom 2.0.0;
include "../trees/incrementalMerkleTree.circom";

component main {public [leaf, root]} = LeafExists(4);
