include "./leaf_existence.circom";
include "./verify_eddsamimc.circom";
include "./get_merkle_root.circom";
include "../circomlib/circuits/mimc.circom";

template ProcessUpdate(k){
    // k is depth of accounts tree

    // accounts tree info
    signal input tree_root;
    signal private input accounts_pubkeys[2**k, 2];
    signal private input accounts_detail[2**k];

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

component main = ProcessUpdate(1);
