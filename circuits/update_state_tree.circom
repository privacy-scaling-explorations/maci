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

  signal input msg_tree_root;
  signal input msg_tree_path_elements[depth];
  signal input msg_tree_path_index[depth];

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

  // Decrypt the message
  component decrypted_command = Decrypt(message_length - 1);
  decrypted_command.private_key <== ecdh.shared_key;
  for (var i = 0; i < message_length; i++) {
    decrypted_command.message[i] <== message[i];
  }

  new_state_tree_root <== decrypted_command.out[6];
}

// template UpdateStateTreeOld(levels) {
//   // levels is depth of tree
//   
//   // Output : new state tree root
//   signal output new_state_tree_root;
// 
//   // Input(s)
//   signal input cmd_tree_root;
//   signal private input cmd_tree_path_elements[levels];
//   signal private input cmd_tree_path_index[levels];
// 
//   signal input state_tree_root;
//   signal private input state_tree_path_elements[levels];
//   signal private input state_tree_path_index[levels];
// 
//   // Length of the encrypted data
//   var encrypted_data_length = 7;
// 
//   // Length of the message (without signature, decrypted)
//   var message_length = 3;
// 
//   // NOTE: Last 3 elements in the arr
//   // MUST BE THE SIGNATURE!
//   /*
//       [0] - iv (generated when msg is encrypted)
//       [1] - publickey_x
//       [2] - publickey_y
//       [3] - action
//       [4] - signature_r8x
//       [5] - signature_r8y
//       [6] - signature_s
//    */
//   signal input encrypted_data[encrypted_data_length];
// 
//   // Shared private key to decrypt encrypted data
//   signal private input ecdh_private_key;
// 
//   // Inputs that are currently in the state tree
//   // that wants to be updated
//   signal private input existing_public_key[2];
//   signal private input existing_state_tree_leaf;
// 
//   // Construct leaf values
//   component encrypted_data_hash = Hasher(encrypted_data_length);
//   encrypted_data_hash.key <== 0;
//   for (var i = 0; i < encrypted_data_length; i++) {
//     encrypted_data_hash.in[i] <== encrypted_data[i];
//   }
// 
//   // **** 1. Make sure the leaf exists in the cmd tree **** //
//   component cmd_tree_value_exists = LeafExists(levels);
//   cmd_tree_value_exists.root <== cmd_tree_root;
//   cmd_tree_value_exists.leaf <== encrypted_data_hash.hash;
//   for (var i = 0; i < levels; i++) {
//     cmd_tree_value_exists.path_elements[i] <== cmd_tree_path_elements[i];
//     cmd_tree_value_exists.path_index[i] <== cmd_tree_path_index[i];
//   }
// 
//   // **** 2. Make sure the state root hash is valid **** //
//   component state_tree_valid = LeafExists(levels);
//   state_tree_valid.root <== state_tree_root;
//   state_tree_valid.leaf <== existing_state_tree_leaf;
//   for (var i = 0; i < levels; i++) {
//     state_tree_valid.path_elements[i] <== state_tree_path_elements[i];
//     state_tree_valid.path_index[i] <== state_tree_path_index[i];
//   }
// 
//   // **** 3.1 Decrypt data **** //
//   component decrypted_data = Decrypt(encrypted_data_length - 1);
//   decrypted_data.private_key <== ecdh_private_key;
//   for (var i = 0; i < encrypted_data_length; i++) {
//     decrypted_data.message[i] <== encrypted_data[i];
//   }
// 
//   // **** 3.2 Validate signature against existing public key **** //
//   component signature_verifier = VerifySignature(message_length);
// 
//   signature_verifier.from_x <== existing_public_key[0]; // public key x
//   signature_verifier.from_y <== existing_public_key[1]; // public key y
// 
//   signature_verifier.R8x <== decrypted_data.out[message_length]; // sig R8x
//   signature_verifier.R8y <== decrypted_data.out[message_length + 1]; // sig R8x
//   signature_verifier.S <== decrypted_data.out[message_length + 2]; // sig S
// 
//   for (var i=0; i < message_length; i++) {
//     signature_verifier.preimage[i] <== decrypted_data.out[i];
//   }
// 
//   // **** 4. If signature valid, update leaf **** //
//   component new_state_tree = MerkleTreeUpdate(levels);
//   new_state_tree.leaf <== encrypted_data_hash.hash;
//   for (var i = 0; i < levels; i++) {
//     new_state_tree.path_elements[i] <== state_tree_path_elements[i];
//     new_state_tree.path_index[i] <== state_tree_path_index[i];
//   }
// 
//   new_state_tree_root <== new_state_tree.root;
// }

// component main = UpdateStateTree(4, 2);
