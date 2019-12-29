include "./decrypt.circom";
include "./ecdh.circom"
include "./hasher.circom";
include "./merkletree.circom";
include "./publickey_derivation.circom"
include "./verify_signature.circom";


template UpdateStateTree(
  depth,
  vote_options_tree_depth
) {
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

  // Note: State tree data length is the
  // command parsed, and then massaged to fit
  // the schema
  var state_tree_data_length = 5;

  // Select vote option index's weight
  // (a.k.a the raw value of the leaf pre-hash)
  signal private input vote_options_leaf_raw;

  // Vote options tree root (supplied by coordinator)
  signal private input vote_options_tree_root;
  signal private input vote_options_tree_path_elements[vote_options_tree_depth];
  signal private input vote_options_tree_path_index[vote_options_tree_depth];
  signal input vote_options_max_leaf_index;

  // Message tree
  signal input msg_tree_root;
  signal input msg_tree_path_elements[depth];
  signal input msg_tree_path_index[depth];

  // State tree
  signal input state_tree_leaf;
  signal private input state_tree_data[state_tree_data_length];

  signal input state_tree_max_leaf_index;
  signal input state_tree_root;
  signal private input state_tree_path_elements[depth];
  signal private input state_tree_path_index[depth];

  // Random leaf (0th index on state tree)
  signal input random_leaf;
  signal private input random_leaf_path_elements[depth];
  signal private input random_leaf_path_index[depth];

  // Shared keys
  signal private input ecdh_private_key;
  signal input ecdh_public_key[2];

  // Logic parameters
  signal private input no_op;

  // Check 1. Coordinator is using correct private key
  component derived_pub_key = PublicKey();
  derived_pub_key.private_key <== ecdh_private_key;

  derived_pub_key.public_key[0] === coordinator_public_key[0]
  derived_pub_key.public_key[1] === coordinator_public_key[1]

  component ecdh = Ecdh();
  ecdh.private_key <== ecdh_private_key;
  ecdh.public_key[0] <== ecdh_public_key[0];
  ecdh.public_key[1] <== ecdh_public_key[1];

  // Check 2. Assert decrypted messages are the same
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

  // Check 3. Make sure the leaf exists in the msg tree
  component msg_tree_leaf_exists = LeafExists(depth);
  msg_tree_leaf_exists.root <== msg_tree_root;
  msg_tree_leaf_exists.leaf <== msg_hash.hash;
  for (var i = 0; i < depth; i++) {
    msg_tree_leaf_exists.path_elements[i] <== msg_tree_path_elements[i];
    msg_tree_leaf_exists.path_index[i] <== msg_tree_path_index[i];
  }

  // Check 4. Make sure the leaf exists in the state tree
  component state_tree_valid = LeafExists(depth);
  state_tree_valid.root <== state_tree_root;
  state_tree_valid.leaf <== state_tree_leaf;
  for (var i = 0; i < depth; i++) {
    state_tree_valid.path_elements[i] <== state_tree_path_elements[i];
    state_tree_valid.path_index[i] <== state_tree_path_index[i];
  }

  // Check 5. Make sure the hash of the data corresponds to the 
  //          existing leaf in the state tree
  component existing_state_tree_leaf_hash = Hasher(state_tree_data_length);
  existing_state_tree_leaf_hash.key <== 0;
  for (var i = 0; i < state_tree_data_length; i++) {
    existing_state_tree_leaf_hash.in[i] <== state_tree_data[i];
  }
  existing_state_tree_leaf_hash.hash === state_tree_leaf;

  // Check 6. Verify the current vote weight exists in the
  //          user's vote_option_tree_root index
  component vote_options_hash = Hasher(1);
  vote_options_hash.key <== 0;
  vote_options_hash.in[0] <== vote_options_leaf_raw;
  
  component vote_options_tree_valid = LeafExists(vote_options_tree_depth);
  vote_options_tree_valid.root <== vote_options_tree_root;
  vote_options_tree_valid.leaf <== vote_options_hash.hash;
  for (var i = 0; i < vote_options_tree_depth; i++) {
    vote_options_tree_valid.path_elements[i] <== vote_options_tree_path_elements[i];
    vote_options_tree_valid.path_index[i] <== vote_options_tree_path_index[i];
  }

  // Update vote_option_tree_root with newly updated vote weight
  component new_vote_options_leaf = Hasher(1);
  new_vote_options_leaf.key <== 0;
  new_vote_options_leaf.in[0] <== vote_options_leaf_raw + decrypted_command.out[4]

  component new_vote_options_tree = MerkleTreeUpdate(vote_options_tree_depth);
  new_vote_options_tree.leaf <== new_vote_options_leaf.hash;
  for (var i = 0; i < vote_options_tree_depth; i++) {
    new_vote_options_tree.path_elements[i] <== vote_options_tree_path_elements[i];
    new_vote_options_tree.path_index[i] <== vote_options_tree_path_index[i];
  }

  // Verify signature against existing public key
  component signature_verifier = VerifySignature(message_length - 4);

  signature_verifier.from_x <== state_tree_data[0]; // public key x
  signature_verifier.from_y <== state_tree_data[1]; // public key y

  signature_verifier.R8x <== decrypted_command.out[message_length - 4]; // sig R8x
  signature_verifier.R8y <== decrypted_command.out[message_length - 3]; // sig R8x
  signature_verifier.S <== decrypted_command.out[message_length - 2]; // sig S

  for (var i = 0; i < message_length - 4; i++) {
    signature_verifier.preimage[i] <== decrypted_command.out[i];
  }

  // Calculate new vote credits
  var new_vote_credits = state_tree_data[3] - (decrypted_command.out[4] * decrypted_command.out[4]);

  // Construct new state tree data (and its hash)
  var new_state_tree_data = [
    decrypted_command.out[1],
    decrypted_command.out[2],
    new_vote_options_tree.root,
    new_vote_credits,
    decrypted_command.out[5]
  ];

  component new_state_tree_leaf = Hasher(state_tree_data_length);
  new_state_tree_leaf.key <== 0;
  for (var i = 0; i < state_tree_data_length; i++) {
    new_state_tree_leaf.in[i] <== new_state_tree_data[i];
  }

  // Checks to see if we should update the
  // random leaf (Note: 0 is true, anything non-zero is false)
  signal valid_signature;
  valid_signature <-- signature_verifier.valid == 0 ? 0 : 1;

  signal sufficient_vote_credits;
  sufficient_vote_credits <-- new_vote_credits > 0 ? 0 : 1;

  signal correct_nonce;
  correct_nonce <-- decrypted_command.out[5] == (state_tree_data[4] + 1) ? 0 : 1;

  signal valid_state_leaf_index;
  valid_state_leaf_index <-- decrypted_command.out[0] <= state_tree_max_leaf_index ? 0 : 1;

  signal valid_vote_options_leaf_index;
  valid_vote_options_leaf_index <-- decrypted_command.out[3] <= vote_options_max_leaf_index ? 0 : 1;

  signal valid_update;
  valid_update = valid_signature + sufficient_vote_credits + correct_nonce + valid_state_leaf_index + valid_vote_options_leaf_index;


  // If any of the above checks return false
  // We update the random leaf instead

  // Note: valid_update 0 is true, 1 is false
  signal selected_state_tree_hash;
  selected_state_tree_hash <-- valid_update == 0 ? new_state_tree_leaf.hash : random_leaf;

  signal selected_state_tree_path_elements[depth];
  for (var i = 0; i < depth; i++) {
    selected_state_tree_path_elements[i] <-- valid_update == 0 ? state_tree_path_elements[i] : random_leaf_path_elements[i];
  }

  signal selected_state_tree_path_index[depth];
  for (var i = 0; i < depth; i++) {
    selected_state_tree_path_index[i] <-- valid_update == 0 ? state_tree_path_index[i] : random_leaf_path_index[i];
  }

  // selected_state_tree_hash can only be the random leaf
  // if the no_op flag is set to true (1)
  signal no_op_valid_update;
  no_op_valid_update <-- valid_update == 0 ? new_state_tree_leaf.hash : no_op * random_leaf;
  
  selected_state_tree_hash === no_op_valid_update;

  component new_state_tree = MerkleTreeUpdate(depth);
  new_state_tree.leaf <== selected_state_tree_hash;
  for (var i = 0; i < depth; i++) {
    new_state_tree.path_elements[i] <== selected_state_tree_path_elements[i];
    new_state_tree.path_index[i] <== selected_state_tree_path_index[i];
  }

  new_state_tree_root <== new_state_tree.root;
}

// component main = UpdateStateTree(4, 2);
