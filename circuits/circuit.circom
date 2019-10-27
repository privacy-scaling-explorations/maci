include "./leaf_existence.circom";
include "./verify_eddsamimc.circom";
include "./merkle_root_op.circom";
include "./decrypt.circom";
include "../node_modules/circomlib/circuits/mimc.circom";


// CommandTreeReducer
template TreeReducer(k) {
    // k is the depth of the tree

    // New merkle
    signal output new_tree_root;

    // Current tree root
    signal input tree_root;
    
    // Shared private key
    signal private input shared_private_key;

    // Length of the decrypted data
    var data_length = 9;

    // NOTE: Last 3 elements in the arr
    // MUST BE THE SIGNATURE!
    /*
        [0] - iv (generated when msg is encrypted)
        [1] - publickey_x
        [2] - publickey_y
        [3] - action
        [4] - new_publickey_x
        [5] - new_publickey_y
        [6] - new_action
        [7] - signature_r8x
        [8] - signature_r8y
        [9] - signature_s
     */
    // encrypted_data has data_length + 1 to store the `iv` value
    signal input encrypted_data[data_length + 1];

    // Public key of the user who
    // published the encrypted_data
    signal input publisher_public_key[2];

    // Last proof submitted
    signal private input sender_proof[k]
    signal private input sender_proof_pos[k];

    // Decrypt encrypted data
    // make sure its the same as the decrypted data
    // supplied by the coordinator
    component decryptor = Decrypt(data_length);

    decryptor.private_key <== shared_private_key;

    for (var i=0; i < data_length + 1; i++) {
        decryptor.message[i] <== encrypted_data[i];
    }

    // Verify account exists in tree_root
    // i.e. check existing hash exists in the tree
    component senderExistence = LeafExistence(k, 3);

    senderExistence.preimage[0] <== decryptor.out[0]; // publickey_x
    senderExistence.preimage[1] <== decryptor.out[1]; // publickey_y
    senderExistence.preimage[2] <== decryptor.out[2]; // action
    senderExistence.root <== tree_root;

    for (var i=0; i<k; i++) {
        senderExistence.paths2_root_pos[i] <== sender_proof_pos[i];
        senderExistence.paths2_root[i] <== sender_proof[i];
    }

    // Verify signature
    component signatureVerifier = VerifyEdDSAMiMC(data_length - 3);

    signatureVerifier.from_x <== publisher_public_key[0]; // public key x
    signatureVerifier.from_y <== publisher_public_key[1]; // public key y
    signatureVerifier.R8x <== decryptor.out[data_length - 3]; // sig R8x
    signatureVerifier.R8y <== decryptor.out[data_length - 2]; // sig R8x
    signatureVerifier.S <== decryptor.out[data_length - 1]; // sig S

    // Hash uses `data_length - 3` components
    // as the data_length has 3 parts signature to it
    for (var i=0; i < data_length - 3;i++) {
        signatureVerifier.preimage[i] <== decryptor.out[i];
    }

    // Update voter leaf
    component newSenderLeaf = MultiMiMC7(3,91){
        newSenderLeaf.in[0] <== decryptor.out[3]; // new_pubkey_x
        newSenderLeaf.in[1] <== decryptor.out[4]; // new_pubkey_y
        newSenderLeaf.in[2] <== decryptor.out[5]; // new_action
    }

    // Update tree root
    component computed_final_root = GetMerkleRoot(k);
    computed_final_root.leaf <== newSenderLeaf.out;
    for (var i = 0; i < k; i++){
        computed_final_root.paths2_root_pos[i] <== sender_proof_pos[i];
        computed_final_root.paths2_root[i] <== sender_proof[i];
    }

    // Verify leaf has been updated
    component senderExistence2 = LeafExistence(k, 3);
    senderExistence2.preimage[0] <== decryptor.out[3]; // new_pubkey_x
    senderExistence2.preimage[1] <== decryptor.out[4]; // new_pubkey_y
    senderExistence2.preimage[2] <== decryptor.out[5]; // new_action
    senderExistence2.root <== computed_final_root.out;
    for (var i = 0; i < k; i++){
        senderExistence2.paths2_root_pos[i] <== sender_proof_pos[i];
        senderExistence2.paths2_root[i] <== sender_proof[i];
    }

    // output final tree_root
    new_tree_root <== computed_final_root.out;
}

component main = TreeReducer(1);
