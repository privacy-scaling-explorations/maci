include "../node_modules/circomlib/circuits/bitify.circom";

include "./update_state_tree.circom";
include "./merkletree.circom";


template BatchUpdateStateTree(
  depth,
  vote_options_tree_depth,
  batch_size
) {
  // params:
  //    depth: the depth of the state tree and the command tree
  //    vote_options_tree_depth: depth of the vote tree
  //    batch_size: the number of messages to process

  // Output: New state tree root
  signal output root;

  // Input(s)
  signal input coordinator_public_key[2];

  var message_length = 11;
  signal input message[batch_size][message_length];

  // Select vote option index's weight
  // (a.k.a the raw value of the leaf pre-hash)
  signal private input vote_options_leaf_raw[batch_size];

  // Vote options tree root (supplied by coordinator)
  signal private input vote_options_tree_root[batch_size];
  signal private input vote_options_tree_path_elements[batch_size][vote_options_tree_depth];
  signal private input vote_options_tree_path_index[batch_size][vote_options_tree_depth];
  signal input vote_options_max_leaf_index;

  // Message tree
  signal input msg_tree_root;
  signal input msg_tree_path_elements[batch_size][depth];
  signal input msg_tree_batch_start_index; // Starting index of the batch

  component msg_tree_path_index[batch_size];
  for (var i = 0; i < batch_size; i++) {
    msg_tree_path_index[i] = Num2Bits(depth);
    msg_tree_path_index[i].in <== msg_tree_batch_start_index + i;
  }

  // Random leaf (updated every batch)
  signal private input random_leaf;
  signal private input random_leaf_path_elements[depth];
  component random_leaf_path_index = Num2Bits(depth);
  random_leaf_path_index.in <== 0;

  // Root when random leaf is inserted
  // As the random leaf is inserted at th end,
  // the random_leaf_root is the end root after all the commands
  // has been processed
  signal private input random_leaf_root;

  // State tree
  var state_tree_data_length = 5;
  signal private input state_tree_data_raw[batch_size][state_tree_data_length];

  signal input state_tree_max_leaf_index;
  signal input state_tree_root[batch_size];
  signal private input state_tree_path_elements[batch_size][depth];
  signal private input state_tree_path_index[batch_size][depth];

  // Shared keys
  signal private input ecdh_private_key;
  signal input ecdh_public_key[batch_size][2];

  component new_state_tree[batch_size];
  for (var i = 0; i < batch_size; i++) {
    new_state_tree[i] = UpdateStateTree(depth, vote_options_tree_depth);

    // Public Key
    new_state_tree[i].coordinator_public_key[0] <== coordinator_public_key[0];
    new_state_tree[i].coordinator_public_key[1] <== coordinator_public_key[1];

    // Message
    for (var j = 0; j < message_length; j++) {
      new_state_tree[i].message[j] <== message[i][j];
    }

    // Vote Options Tree
    new_state_tree[i].vote_options_leaf_raw <== vote_options_leaf_raw[i];
    new_state_tree[i].vote_options_tree_root <== vote_options_tree_root[i];
    for (var j = 0; j < vote_options_tree_depth; j++) {
      new_state_tree[i].vote_options_tree_path_elements[j] <== vote_options_tree_path_elements[i][j];
      new_state_tree[i].vote_options_tree_path_index[j] <== vote_options_tree_path_index[i][j];
    }
    new_state_tree[i].vote_options_max_leaf_index <== vote_options_max_leaf_index;

    // Message Tree
    new_state_tree[i].msg_tree_root <== msg_tree_root;
    for (var j = 0; j < depth; j++) {
      new_state_tree[i].msg_tree_path_elements[j] <== msg_tree_path_elements[i][j];
      new_state_tree[i].msg_tree_path_index[j] <== msg_tree_path_index[i].out[j];
    }

    // State Tree
    new_state_tree[i].state_tree_root <== state_tree_root[i];
    for (var j = 0; j < state_tree_data_length; j++) {
      new_state_tree[i].state_tree_data_raw[j] <== state_tree_data_raw[i][j];
    }
    for (var j = 0; j < depth; j++) {
      new_state_tree[i].state_tree_path_elements[j] <== state_tree_path_elements[i][j];
      new_state_tree[i].state_tree_path_index[j] <== state_tree_path_index[i][j];
    }
    new_state_tree[i].state_tree_max_leaf_index <== state_tree_max_leaf_index;

    // Shared Keys
    new_state_tree[i].ecdh_private_key <== ecdh_private_key;

    new_state_tree[i].ecdh_public_key[0] <== ecdh_public_key[i][0];
    new_state_tree[i].ecdh_public_key[1] <== ecdh_public_key[i][1];
  }

  // Update random leaf at index 0
  component final_state_tree = MerkleTreeUpdate(depth);
  final_state_tree.leaf <== random_leaf;
  for (var i = 0; i < depth; i++) {
    final_state_tree.path_elements[i] <== random_leaf_path_elements[i];
    final_state_tree.path_index[i] <== random_leaf_path_index.out[i];
  }

  // Assert root calculations are valid
  for (var i = 0; i < batch_size - 1; i++) {
    new_state_tree[i].root === state_tree_root[i + 1];
  }
  new_state_tree[batch_size - 1].root === random_leaf_root;


  root <== final_state_tree.root;
}
