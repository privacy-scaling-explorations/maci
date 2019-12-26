// Referenced https://github.com/peppersec/tornado-mixer/blob/master/circuits/merkleTree.circom

include "./hasher.circom";

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

  // Ensure that path_index is either 0 or 1
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
  //       obtained from merkletree.js's `getPathUpdate` function
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

template CheckRoot(levels) {
    // Given a Merkle root and a list of leaves, check if the root is the
    // correct result of inserting all the leaves into the tree (in the given
    // order)

    // Circom has some perticularities which limit the code patterns we can
    // use.
    // First of all, you can only assign a value to a signal once.
    // A component's input signal must only be wired to another component's output
    // signal
    // Variables are only used for loops, declaring sizes of things, and anything
    // that is not related to inputs of a circuit.

    // The total number of leaves
    var totalLeaves = 2 ** levels;

    // The number of HashLeftRight components which will be used to hash the
    // leaves
    var numLeafHashers = totalLeaves / 2;

    // The number of HashLeftRight components which will be used to hash the
    // output of the leaf hasher components
    var numIntermediateHashers = numLeafHashers - 1;

    // Inputs to the snark
    signal private input leaves[totalLeaves];

    // The output
    signal output root;

    // The total number of hashers
    var numHashers = totalLeaves - 1;
    component hashers[numHashers];

    // Instantiate all hashers
    var i;
    for (i=0; i < numHashers; i++) {
        hashers[i] = HashLeftRight();
    }

    // Wire the leaf values into the leaf hashers
    for (i=0; i < numLeafHashers; i++){
        hashers[i].left <== leaves[i*2];
        hashers[i].right <== leaves[i*2+1];
    }

    // Wire the outputs of the leaf hashers to the intermediate hasher inputs
    var k = 0;
    for (i=numLeafHashers; i<numLeafHashers + numIntermediateHashers; i++) {
        hashers[i].left <== hashers[k*2].hash;
        hashers[i].right <== hashers[k*2+1].hash;
        k++;
    }

    // Wire the output of the final hash to this circuit's output
    root <== hashers[numHashers-1].hash;
}
