include "./decrypt.circom";
include "./ecdh.circom"
include "./hasher.circom";
include "./merkletree.circom";
include "./publickey_derivation.circom"
include "./verify_signature.circom";


template UpdateStateTree(depth, vote_options_tree_depth) {
  // params:
  //    depth: the depth of the state tree and the command tree
  //    vote_options_tree_depth: depth of the vote tree

  // Output: New state tree root
  signal output new_state_tree_root;

  // Input(s)
  signal input coordinator_public_key[2];

  // Note: message is the encrypted command
  var message_length = 11;
  /* let n = vote_options_tree_depth

     anything > 0 is encrypted

      [0]  - iv (generated when msg is encrypted)
      [1]  - state_tree_index
      [2]  - publickey_x
      [3]  - publickey_y
      [4]  - vote_option_index
      [5]  - vote_weight
      [6]  - nonce
      [7]  - salt
      [8]  - signature_r8x
      [9]  - signature_r8y
      [10] - signature_s
  */
  signal input message[message_length];

  // Command is the decrypted message
  // Is the same format as message
  // But doesn't have the iv
  signal input command[message_length - 1];

  signal input msg_tree_root;
  signal input msg_tree_path_elements[depth];
  signal input msg_tree_path_index[depth];

  // Note: State tree data length is the
  // command parsed, and then massaged to fit
  // the schema
  var state_tree_data_length = 5;

  // Vote options tree root (supplied by coordinator)
  signal private input vote_options_tree_root;
  signal input existing_state_tree_leaf;
  signal private input existing_state_tree_data[state_tree_data_length];
  signal input state_tree_max_leaf_index;
  signal input state_tree_root;
  signal private input state_tree_path_elements[depth];
  signal private input state_tree_path_index[depth];

  // Random leaf (0th index on state tree)
  signal input random_leaf;
  signal private input random_leaf_path_elements[depth];
  signal private input random_leaf_path_index[depth];

  signal private input no_op;

  signal private input ecdh_private_key;
  signal input ecdh_public_key[2];

  // Assert coordinator is using the correct
  // private key
  component derived_pub_key = PublicKey();
  derived_pub_key.private_key <== ecdh_private_key;

  derived_pub_key.public_key[0] === coordinator_public_key[0]
  derived_pub_key.public_key[1] === coordinator_public_key[1]

  component ecdh = Ecdh();
  ecdh.private_key <== ecdh_private_key;
  ecdh.public_key[0] <== ecdh_public_key[0];
  ecdh.public_key[1] <== ecdh_public_key[1];

  // Decrypt the message and assert the coordinator got the same
  component decrypted_command = Decrypt(message_length - 1);
  decrypted_command.private_key <== ecdh.shared_key;
  for (var i = 0; i < message_length; i++) {
    decrypted_command.message[i] <== message[i];
  }

  for (var i = 0; i < message_length - 1; i++) {
    decrypted_command.out[i] === command[i];
  }

  // Construct leaf value
  component msg_hash = Hasher(message_length);
  msg_hash.key <== 0;
  for (var i = 0; i < message_length; i++) {
    msg_hash.in[i] <== message[i];
  }

  // Make sure the leaf exists in the cmd tree
  component msg_tree_leaf_exists = LeafExists(depth);
  msg_tree_leaf_exists.root <== msg_tree_root;
  msg_tree_leaf_exists.leaf <== msg_hash.hash;
  for (var i = 0; i < depth; i++) {
    msg_tree_leaf_exists.path_elements[i] <== msg_tree_path_elements[i];
    msg_tree_leaf_exists.path_index[i] <== msg_tree_path_index[i];
  }

  // Make sure the leaf exists in the state tree
  component state_tree_valid = LeafExists(depth);
  state_tree_valid.root <== state_tree_root;
  state_tree_valid.leaf <== existing_state_tree_leaf;
  for (var i = 0; i < depth; i++) {
    state_tree_valid.path_elements[i] <== state_tree_path_elements[i];
    state_tree_valid.path_index[i] <== state_tree_path_index[i];
  }

  // Make sure the hash of the data equals to the existing_state_tree_leaf
  component existing_state_tree_leaf_hash = Hasher(state_tree_data_length);
  existing_state_tree_leaf_hash.key <== 0;
  for (var i = 0; i < state_tree_data_length; i++) {
    existing_state_tree_leaf_hash.in[i] <== existing_state_tree_data[i];
  }
  existing_state_tree_leaf_hash.hash === existing_state_tree_leaf;

  // Verify signature against existing public key
  component signature_verifier = VerifySignature(message_length - 4);

  signature_verifier.from_x <== existing_state_tree_data[0]; // public key x
  signature_verifier.from_y <== existing_state_tree_data[1]; // public key y

  signature_verifier.R8x <== decrypted_command.out[message_length - 4]; // sig R8x
  signature_verifier.R8y <== decrypted_command.out[message_length - 3]; // sig R8x
  signature_verifier.S <== decrypted_command.out[message_length - 2]; // sig S

  for (var i = 0; i < message_length - 4; i++) {
    signature_verifier.preimage[i] <== decrypted_command.out[i];
  }

  // TODO: Check if user has enough vote option balance
  // TODO: Make sure nonce is + 1
  // decrypted_command.out[5] === existing_state_tree_data[4] + 1;

  // Update root with newly constructed state leaf
  var new_state_tree_data = [
    decrypted_command.out[1],
    decrypted_command.out[2],
    vote_options_tree_root,
    existing_state_tree_data[3] - (decrypted_command.out[4] * decrypted_command.out[4]),
    decrypted_command.out[5]
  ];

  component new_state_tree_leaf = Hasher(state_tree_data_length);
  new_state_tree_leaf.key <== 0;
  for (var i = 0; i < state_tree_data_length; i++) {
    new_state_tree_leaf.in[i] <== new_state_tree_data[i];
  }

  component new_state_tree = MerkleTreeUpdate(depth);
  new_state_tree.leaf <== new_state_tree_leaf.hash;
  for (var i = 0; i < depth; i++) {
    new_state_tree.path_elements[i] <== state_tree_path_elements[i];
    new_state_tree.path_index[i] <== state_tree_path_index[i];
  }

  new_state_tree_root <== new_state_tree.root;
}

// component main = UpdateStateTree(4, 2);
