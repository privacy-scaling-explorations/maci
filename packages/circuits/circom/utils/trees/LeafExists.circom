pragma circom 2.0.0;

// local import
include "./MerkleTreeInclusionProof.circom";

/**
 * Ensures that a leaf exists within a Merkle tree with a given root.
 */
template LeafExists(levels){
  // The leaf whose existence within the tree is being verified.
  signal input leaf;

  // The elements along the path needed for the inclusion proof.
  signal input path_elements[levels][1];
  // The indices indicating the path taken through the tree for the leaf.
  signal input path_index[levels];
  // The root of the Merkle tree, against which the inclusion is verified.
  signal input root;

  var computedMerkleRoot = MerkleTreeInclusionProof(levels)(
    leaf,
    path_index,
    path_elements
  );

  root === computedMerkleRoot;
}
