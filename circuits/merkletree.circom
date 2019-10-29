// Referenced https://github.com/peppersec/tornado-mixer/blob/master/circuits/merkleTree.circom

include "../node_modules/circomlib/circuits/mimc.circom"

template HashLeftRight() {
  signal input left;
  signal input right;

  signal output hash;

  component hasher = MultiMiMC7(2, 91);
  hasher.in[0] <== left;
  hasher.in[1] <== right;

  hash <== hasher.out;
}

// if path_index == 0 returns (left = input_element, right = path_element)
// if path_index == 1 returns (left = path_element, right = input_element)
template UpdateSelector() {
  signal input input_element;
  signal input path_element;
  signal input path_index;

  signal output left;
  signal output right;

  signal leftSelector1;
  signal leftSelector2;
  signal rightSelector1;
  signal rightSelector2;

  path_index * (1-path_index) === 0

  leftSelector1 <== (1 - path_index) * input_element;
  leftSelector2 <== (path_index) * path_element;
  rightSelector1 <== (path_index) * input_element;
  rightSelector2 <== (1 - path_index) * path_element;

  left <== leftSelector1 + leftSelector2;
  right <== rightSelector1 + rightSelector2;
}


template MerkleTreeUpdate(levels) {
  // Computes new merkletree root on update
  // NOTE: path_elements and path_index can be
  //       obtained from merkletree.js `getPath` function
  signal input leaf;

  signal private input path_elements[levels];
  signal private input path_index[levels];

  signal output root;

  component selectors[levels];
  component hashers[levels];

  for (var i = 0; i < levels; i++) {
    selectors[i] = UpdateSelector();
    hashers[i] = HashLeftRight();

    selectors[i].path_element <== path_elements[i];
    selectors[i].path_index <== path_index[i];

    hashers[i].left <== selectors[i].left;
    hashers[i].right <== selectors[i].right;
  }

  selectors[0].input_element <== leaf;

  for (var i = 1; i < levels; i++) {
    selectors[i].input_element <== hashers[i-1].hash;
  }

  root <== hashers[levels - 1].hash;
}

// if path_index == 0 returns (left = input_element, right = zero)
// if path_index == 1 returns (left = filled_sub_tree, right = input_element)
template InsertSelector() {
  signal input input_element; 
  signal input filled_sub_tree;
  // zeroValue hashed n times (where n is the depth of the current leaf in the tree)
  signal input zero; 

  signal input path_index;

  signal output left;
  signal output right;

  signal leftSelector1;
  signal leftSelector2;
  signal rightSelector1;
  signal rightSelector2;

  path_index * (1-path_index) === 0

  leftSelector1 <== (1 - path_index) * input_element;
  leftSelector2 <== (path_index) * filled_sub_tree;
  rightSelector1 <== (path_index) * zero;
  rightSelector2 <== (1 - path_index) * input_element;

  left <== leftSelector1 + leftSelector2;
  right <== rightSelector1 + rightSelector2;
}

template MerkleTreeInsert(levels) {
  // Computes new merkletree root on insert
  signal input leaf;

  // Hashed zeros
  signal private input zeros[levels];
  signal private input filled_sub_trees[levels];
  signal private input path_index[levels];

  signal output root;

  component selectors[levels];
  component hashers[levels];

  for (var i = 0; i < levels; i++) {
    selectors[i] = InsertSelector();
    hashers[i] = HashLeftRight();

    selectors[i].zero <== zeros[i];
    selectors[i].filled_sub_tree <== filled_sub_trees[i];
    selectors[i].path_index <== path_index[i];

    hashers[i].left <== selectors[i].left;
    hashers[i].right <== selectors[i].right;
  }

  selectors[0].input_element <== leaf;

  for (var i = 1; i < levels; i++) {
    selectors[i].input_element <== hashers[i-1].hash;
  }

  root <== hashers[levels - 1].hash;
}


template LeafExists(levels){
  // Ensures that a leaf exists within a merkletree with given `root`

  // levels is depth of tree
  signal input leaf;

  signal private input path_elements[levels];
  signal private input path_index[levels];

  signal input root;

  component merkletree = MerkleTreeUpdate(levels);
  merkletree.leaf <== leaf;
  for (var i = 0; i < levels; i++) {
    merkletree.path_index[i] <== path_index[i];
    merkletree.path_elements[i] <== path_elements[i];
  }

  root === merkletree.root;
}
