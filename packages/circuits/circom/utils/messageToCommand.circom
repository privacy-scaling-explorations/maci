pragma circom 2.0.0;

// circomlib import
include "./bitify.circom";
// zk-kit imports
include "./ecdh.circom";
include "./unpack-element.circom";
include "./poseidon-cipher.circom";
// local imports
include "./hashers.circom";

/**
 * Converts a MACI message to a command by decrypting it.
 * Processes encrypted MACI messages into structured MACI commands 
 * by decrypting using a shared key derived from ECDH. After decryption, 
 * unpacks and assigns decrypted values to specific command components. 
 */
template MessageToCommand() {
    var MSG_LENGTH = 7;
    var PACKED_CMD_LENGTH = 4;
    var UNPACKED_CMD_LENGTH = 8;
    var UNPACK_ELEM_LENGTH = 5;
    var DECRYPTED_LENGTH = 9;
    var MESSAGE_PARTS = 10;

    // The message is an array of 10 parts.
    signal input message[MESSAGE_PARTS];
    signal input encPrivKey;
    signal input encPubKey[2];

    // Command parts.
    signal output stateIndex;
    signal output newPubKey[2];
    signal output voteOptionIndex;
    signal output newVoteWeight;
    signal output nonce;
    signal output pollId;
    signal output salt;
    signal output sigR8[2];
    signal output sigS;
    // Packed command. 
    signal output packedCommandOut[PACKED_CMD_LENGTH];

    // Generate the shared key for decrypting the message.
    var computedEcdh[2] = Ecdh()(encPrivKey, encPubKey);

    // Decrypt the message using Poseidon decryption.
    var computedDecryptor[DECRYPTED_LENGTH] = PoseidonDecryptWithoutCheck(MSG_LENGTH)(
        message,
        0, 
        computedEcdh
    );

    // Save the decrypted message into a packed command signal.
    signal packedCommand[PACKED_CMD_LENGTH];
    for (var i = 0; i < PACKED_CMD_LENGTH; i++) {
        packedCommand[i] <== computedDecryptor[i];
    }

    var computedUnpackElement[UNPACK_ELEM_LENGTH] = UnpackElement(UNPACK_ELEM_LENGTH)(packedCommand[0]);

    // Everything below were packed into the first element.
    stateIndex <== computedUnpackElement[4];
    voteOptionIndex <== computedUnpackElement[3];
    newVoteWeight <== computedUnpackElement[2];
    nonce <== computedUnpackElement[1];
    pollId <== computedUnpackElement[0];

    newPubKey[0] <== packedCommand[1];
    newPubKey[1] <== packedCommand[2];
    salt <== packedCommand[3];

    sigR8[0] <== computedDecryptor[4];
    sigR8[1] <== computedDecryptor[5];
    sigS <== computedDecryptor[6];

    packedCommandOut <== packedCommand;
}
