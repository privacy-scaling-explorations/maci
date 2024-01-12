pragma circom 2.0.0;

// circomlib import
include "./bitify.circom";
// @zk-kit import
include "./poseidon-cipher.circom";

// local imports
include "./ecdh.circom";
include "./unpackElement.circom";

// template that converts a MACI message
// to a command (decrypts it)
template MessageToCommand() {
    var MSG_LENGTH = 7;
    var PACKED_CMD_LENGTH = 4;
    var UNPACKED_CMD_LENGTH = 8;

    // the message is an array of 11 parts
    signal input message[11];
    // we have the encryption private key
    signal input encPrivKey;
    // and the encryption public key
    signal input encPubKey[2];

    // we output all of the parts of the command
    signal output stateIndex;
    signal output newPubKey[2];
    signal output voteOptionIndex;
    signal output newVoteWeight;
    signal output nonce;
    signal output pollId;
    signal output salt;
    signal output sigR8[2];
    signal output sigS;
    // and also the packed command 
    signal output packedCommandOut[PACKED_CMD_LENGTH];

    // generate the shared key so we can decrypt 
    // the message with it
    component ecdh = Ecdh();
    ecdh.privKey <== encPrivKey;
    ecdh.pubKey[0] <== encPubKey[0];
    ecdh.pubKey[1] <== encPubKey[1];

    // decrypt the message using poseidon decryption 
    component decryptor = PoseidonDecryptWithoutCheck(MSG_LENGTH);
    decryptor.key[0] <== ecdh.sharedKey[0];
    decryptor.key[1] <== ecdh.sharedKey[1];
    decryptor.nonce <== 0;
    for (var i = 1; i < 11; i++) { 
        // the first one is msg type, skip
        decryptor.ciphertext[i-1] <== message[i];
    }

    // save the decrypted message into a packed command signal
    signal packedCommand[PACKED_CMD_LENGTH];
    for (var i = 0; i < PACKED_CMD_LENGTH; i ++) {
        packedCommand[i] <== decryptor.decrypted[i];
    }

    component unpack = UnpackElement(5);
    unpack.in <== packedCommand[0];

    // all of the below were packed
    // into the first element
    stateIndex <== unpack.out[4];
    voteOptionIndex <== unpack.out[3];
    newVoteWeight <== unpack.out[2];
    nonce <== unpack.out[1];
    pollId <== unpack.out[0];

    newPubKey[0] <== packedCommand[1];
    newPubKey[1] <== packedCommand[2];
    salt <== packedCommand[3];

    sigR8[0] <== decryptor.decrypted[4];
    sigR8[1] <== decryptor.decrypted[5];
    sigS <== decryptor.decrypted[6];

    // this could be removed and instead
    // use packedCommand as output
    for (var i = 0; i < PACKED_CMD_LENGTH; i ++) {
        packedCommandOut[i] <== packedCommand[i];
    }
}
