include "./leaf_existence.circom"
include "./verify_eddsamimc.circom"
include "./merkle_root_op.circom"
include "./merkletree.circom"
include "./decrypt.circom"
include "../node_modules/circomlib/circuits/mimc.circom";


template MACI(k) {
  component mki = MerkleTreeInsert(k);
  component mku = MerkleTreeUpdate(k);
}

component main = MACI(1);
