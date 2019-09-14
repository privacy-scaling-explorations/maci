include "./leaf_existence.circom";
include "./verify_eddsamimc.circom";
include "./get_merkle_root.circom";
include "./decrypt.circom";
include "../node_modules/circomlib/circuits/mimc.circom";


template TreeReducer(k) {
    // k is the depth of accounts tree

    // output
    signal output new_tree_root;

    // Tree info (where accounts are stored)
    signal input tree_root;
    signal private input accounts_pubkeys[2**k, 2];

    // Shared private key
    signal private input shared_private_key;

    // Length of the decrypted data
    var data_length = 9;

    // vote action(s) - encrypted
    // NOTE: Last 3 elements in the dats will
    // ALWAYS BE THE SIGNATURE!
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
    signal input encrypted_data[data_length + 1];

    // vote action(s) - decrypted
    // 1 less than encrypted data as it doesn't have `iv`
    signal private input decrypted_data[data_length];

    // Last proof submitted
    signal private input sender_proof[k]
    signal private input sender_proof_pos[k];

    // Decrypt encrypted data
    // make sure its the same as the decrypted data
    // supplied by the coordinator
    component decryptor = Decrypt(data_length);

    decryptor.private_key <== shared_private_key;

    for (var i=0; i<data_length + 1; i++) {
        decryptor.message[i] <== encrypted_data[i];
    }
    for (var i=0; i<data_length; i++) {
        decryptor.out[i] === decrypted_data[i];
    }

    // Verify account exists in tree_root
    // i.e. check existing hash exists in the tree
    component senderExistence = LeafExistence(k, 3);

    senderExistence.preimage[0] <== decrypted_data[0]; // publickey_x
    senderExistence.preimage[1] <== decrypted_data[1]; // publickey_y
    senderExistence.preimage[2] <== decrypted_data[2]; // action
    senderExistence.root <== tree_root;

    for (var i=0; i<k; i++) {
        senderExistence.paths2_root_pos[i] <== sender_proof_pos[i];
        senderExistence.paths2_root[i] <== sender_proof[i];
    }

    // Verify signature
    // Hash uses `data_length - 3` components
    // as the data_length has 3 parts signature to it
    component signatureVerifier = VerifyEdDSAMiMC(data_length - 3);

    signatureVerifier.from_x <== decrypted_data[0]; // public key x
    signatureVerifier.from_y <== decrypted_data[1]; // public key y
    signatureVerifier.R8x <== decrypted_data[data_length - 3]; // sig R8x
    signatureVerifier.R8y <== decrypted_data[data_length - 2]; // sig R8x
    signatureVerifier.S <== decrypted_data[data_length - 1]; // sig S

    for (var i=0; i<data_length - 3;i++) {
        signatureVerifier.preimage[i] <== decrypted_data[i];
    }

    // Update voter leaf
    component newSenderLeaf = MultiMiMC7(3,91){
        newSenderLeaf.in[0] <== decrypted_data[3]; // new_pubkey_x
        newSenderLeaf.in[1] <== decrypted_data[4]; // new_pubkey_y
        newSenderLeaf.in[2] <== decrypted_data[5]; // new_action
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
    senderExistence2.preimage[0] <== decrypted_data[3]; // new_pubkey_x
    senderExistence2.preimage[1] <== decrypted_data[4]; // new_pubkey_y
    senderExistence2.preimage[2] <== decrypted_data[5]; // new_action
    senderExistence2.root <== computed_final_root.out;
    for (var i = 0; i < k; i++){
        senderExistence2.paths2_root_pos[i] <== sender_proof_pos[i];
        senderExistence2.paths2_root[i] <== sender_proof[i];
    }

    // output final tree_root
    new_tree_root <== computed_final_root.out;
}

component main = TreeReducer(1);