pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "./elGamalDecryption.circom";
include "./ecdh.circom";

template NewKeyMessageToCommand() {
    var MESSAGE_LENGTH = 9;
    var ENC_MESSAGE_LENGTH = 11;

    signal input encPrivKey;
    signal input encPubKey[2];
    signal input message[ENC_MESSAGE_LENGTH];

    signal output newPubKey[2];
    signal output newCreditBalance;
    signal output nullifier;
    signal output c1r[2];
    signal output c2r[2];
    signal output pollId;
    signal output isValidStatus;

    // Compute shared key
    component ecdh = Ecdh();
    ecdh.privKey <== encPrivKey;
    ecdh.pubKey[0] <== encPubKey[0];
    ecdh.pubKey[1] <== encPubKey[1];

    // Decrypt message
    component decryptor = PoseidonDecryptWithoutCheck(MESSAGE_LENGTH);
    decryptor.key[0] <== ecdh.sharedKey[0];
    decryptor.key[1] <== ecdh.sharedKey[1];
    decryptor.nonce <== 0;

    for (var i = 1; i < ENC_MESSAGE_LENGTH; i++) {
        decryptor.ciphertext[i-1] <== message[i];
    }

    newPubKey[0] <== decryptor.decrypted[0];
    newPubKey[1] <== decryptor.decrypted[1];
    newCreditBalance <== decryptor.decrypted[2];
    nullifier <== decryptor.decrypted[3];
    c1r[0] <== decryptor.decrypted[4];
    c1r[1] <== decryptor.decrypted[5];
    c2r[0] <== decryptor.decrypted[6];
    c2r[1] <== decryptor.decrypted[7];
    pollId <== decryptor.decrypted[8];

    // Decrypt status
    component decStatus = ElGamalDecryptBit();
    decStatus.kG[0] <== c1r[0];
    decStatus.kG[1] <== c1r[1];
    decStatus.Me[0] <== c2r[0];
    decStatus.Me[1] <== c2r[1];
    decStatus.sk <== encPrivKey;

    isValidStatus <== decStatus.m;
}