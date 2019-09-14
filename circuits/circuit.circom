include "./leaf_existence.circom";
include "./verify_eddsamimc.circom";
include "./get_merkle_root.circom";
include "./decrypt.circom";
include "../node_modules/circomlib/circuits/mimc.circom";

template ProcessUpdate(k){
    // k is depth of accounts tree

    // accounts tree info
    signal input tree_root;
    signal private input accounts_pubkeys[2**k, 2];

    // vote update info
    signal private input sender_pubkey[2];
    signal private input sender_detail;
    signal private input sender_updated_pubkey[2];
    signal private input sender_updated_detail;
    signal private input signature_R8x;
    signal private input signature_R8y;
    signal private input signature_S;
    signal private input sender_proof[k];
    signal private input sender_proof_pos[k];

    // output
    signal output new_tree_root;

    // verify sender account exists in tree_root
    component senderExistence = LeafExistence(k, 3);
    senderExistence.preimage[0] <== sender_pubkey[0];
    senderExistence.preimage[1] <== sender_pubkey[1];
    senderExistence.preimage[2] <== sender_detail;
    senderExistence.root <== tree_root;
    for (var i = 0; i < k; i++){
        senderExistence.paths2_root_pos[i] <== sender_proof_pos[i];
        senderExistence.paths2_root[i] <== sender_proof[i];
    }

    // check that vote update was signed by voter
    component signatureCheck = VerifyEdDSAMiMC(5);
    signatureCheck.from_x <== sender_pubkey[0];
    signatureCheck.from_y <== sender_pubkey[1];
    signatureCheck.R8x <== signature_R8x;
    signatureCheck.R8y <== signature_R8y;
    signatureCheck.S <== signature_S;
    
    signatureCheck.preimage[0] <== sender_pubkey[0];
    signatureCheck.preimage[1] <== sender_pubkey[1];
    signatureCheck.preimage[2] <== sender_updated_detail;
    signatureCheck.preimage[3] <== sender_updated_pubkey[0];
    signatureCheck.preimage[4] <== sender_updated_pubkey[1];

    // change voter leave and hash
    component newSenderLeaf = MultiMiMC7(3,91){
        newSenderLeaf.in[0] <== sender_updated_pubkey[0];
        newSenderLeaf.in[1] <== sender_updated_pubkey[1];
	    newSenderLeaf.in[2] <== sender_updated_detail;
    }

    // update tree_root
    component computed_final_root = GetMerkleRoot(k);
    computed_final_root.leaf <== newSenderLeaf.out;
    for (var i = 0; i < k; i++){
         computed_final_root.paths2_root_pos[i] <== sender_proof_pos[i];
         computed_final_root.paths2_root[i] <== sender_proof[i];
    }

    // verify voter leaf has been updated
    component senderExistence2 = LeafExistence(k, 3);
    senderExistence2.preimage[0] <== sender_updated_pubkey[0];
    senderExistence2.preimage[1] <== sender_updated_pubkey[1];
    senderExistence2.preimage[2] <== sender_updated_detail;
    senderExistence2.root <== computed_final_root.out;
    for (var i = 0; i < k; i++){
        senderExistence2.paths2_root_pos[i] <== sender_proof_pos[i];
        senderExistence2.paths2_root[i] <== sender_proof[i];
    }

    // output final tree_root
    new_tree_root <== computed_final_root.out;
}


template TreeReducer(k) {
    // k is the depth of accounts tree

    // Tree info (where accounts are stored)
    // signal input tree_root;
    // signal private input accounts_pubkeys[2**k, 2];

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

    // Verify sender account exists in tree_root
    // component senderExistence = LeafExistence(k, 3);

    // senderExistence.preimage[0] <== decrypted_data[0];
    // senderExistence.preimage[1] <== decrypted_data[1];
    // senderExistence.preimage[2] <== decrypted_data[2];
    // senderExistence.root <== tree_root;

    // for (var i=0; i<k; i++) {
    //     senderExistence.paths2_root_pos[i] <== sender_proof_pos[i];
    //     senderExistence.paths2_root[i] <== sender_proof[i];
    // }


    // Verify Signature
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
}

component main = TreeReducer(1);