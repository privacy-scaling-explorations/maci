include "./merkletree.circom";
include "./verify_eddsamimc.circom";
include "./decrypt.circom";

include "../node_modules/circomlib/circuits/mimc.circom";

template MACI(levels) {
  // levels is depth of tree
  
  // Output : new state tree root
  signal output new_state_tree_root;

  // Input(s)
  signal input cmd_tree_root;
  signal private input cmd_tree_path_elements[levels];
  signal private input cmd_tree_path_index[levels];

  signal input state_tree_root;
  signal private input state_tree_path_elements[levels];
  signal private input state_tree_path_index[levels];

  // Length of the encrypted data
  var encrypted_data_length = 7;

  // Length of the message (without signature, decrypted)
  var message_length = 3;

  // Hashing rounds
  var rounds = 91;

  // NOTE: Last 3 elements in the arr
  // MUST BE THE SIGNATURE!
  /*
      [0] - iv (generated when msg is encrypted)
      [1] - publickey_x
      [2] - publickey_y
      [3] - action
      [4] - signature_r8x
      [5] - signature_r8y
      [6] - signature_s
   */
  signal input encrypted_data[encrypted_data_length];

  // Inputs that are currently in the state tree
  // that wants to be updated
  signal private input existing_public_key[2];
  signal private input existing_state_tree_leaf;

  // Shared private key
  signal private input ecdh_private_key;

  // Construct leaf values
  component encrypted_data_hash = MultiMiMC7(encrypted_data_length, rounds);
  for (var i = 0; i < encrypted_data_length; i++) {
    encrypted_data_hash.in[i] <== encrypted_data[i];
  }

  // **** 1. Make sure the leaf exists in the cmd tree **** //
  component cmd_tree_value_exists = LeafExists(levels);
  cmd_tree_value_exists.root <== cmd_tree_root;
  cmd_tree_value_exists.leaf <== encrypted_data_hash.out;
  for (var i = 0; i < levels; i++) {
    cmd_tree_value_exists.path_elements[i] <== cmd_tree_path_elements[i];
    cmd_tree_value_exists.path_index[i] <== cmd_tree_path_index[i];
  }

  // **** 2. Make sure the state root hash is valid **** //
  component state_tree_valid = LeafExists(levels);
  state_tree_valid.root <== state_tree_root;
  state_tree_valid.leaf <== existing_state_tree_leaf;
  for (var i = 0; i < levels; i++) {
    state_tree_valid.path_elements[i] <== state_tree_path_elements[i];
    state_tree_valid.path_index[i] <== state_tree_path_index[i];
  }

  // **** 3.1 Decrypt data **** //
  component decrypted_data = Decrypt(encrypted_data_length - 1);
  decrypted_data.private_key <== ecdh_private_key;
  for (var i = 0; i < encrypted_data_length; i++) {
    decrypted_data.message[i] <== encrypted_data[i];
  }

  // **** 3.2 Validate signature against existing public key **** //
  component signature_verifier = VerifyEdDSAMiMC(message_length);

  signature_verifier.from_x <== existing_public_key[0]; // public key x
  signature_verifier.from_y <== existing_public_key[1]; // public key y

  signature_verifier.R8x <== decrypted_data.out[message_length]; // sig R8x
  signature_verifier.R8y <== decrypted_data.out[message_length + 1]; // sig R8x
  signature_verifier.S <== decrypted_data.out[message_length + 2]; // sig S

  for (var i=0; i < message_length; i++) {
    signature_verifier.preimage[i] <== decrypted_data.out[i];
  }

  // **** 4. If signature valid, update leaf **** //
  component new_state_tree = MerkleTreeUpdate(levels);
  new_state_tree.leaf <== encrypted_data_hash.out;
  for (var i = 0; i < levels; i++) {
    new_state_tree.path_elements[i] <== state_tree_path_elements[i];
    new_state_tree.path_index[i] <== state_tree_path_index[i];
  }

  new_state_tree_root <== new_state_tree.root;
}

component main = MACI(4);
