pragma circom 2.0.0;

// circomlib import
include "./bitify.circom";
// zk-kit imports
include "./ecdh.circom";
include "./unpack-element.circom";
include "./poseidon-cipher.circom";

/**
 * Converts a MACI message to a command by decrypting it.
 * Processes encrypted MACI messages into structured MACI commands 
 * by decrypting using a shared key derived from ECDH. After decryption, 
 * unpacks and assigns decrypted values to specific command components. 
 */
template MessageToCommand() {
    var MESSAGE_LENGTH = 7;
    var PACKED_COMMAND_LENGTH = 4;
    var UNPACK_ELEMENT_LENGTH = 5;
    var DECRYPTED_LENGTH = 9;
    var MESSAGE_PARTS = 10;
    
    // Element indices.
    var ELEMENT_POLL_ID = 0;
    var ELEMENT_NONCE = 1;
    var ELEMENT_NEW_VOTE_WEIGHT = 2;
    var ELEMENT_VOTE_OPTION_INDEX = 3;
    var ELEMENT_STATE_INDEX = 4;

    // Command indices.
    var COMMAND_STATE_INDEX = 0;
    var COMMAND_PUBLIC_KEY_X = 1;
    var COMMAND_PUBLIC_KEY_Y = 2;
    var COMMAND_SALT = 3;

    // Decryptor indices.
    var SIGNATURE_POINT_X = 4;
    var SIGNATURE_POINT_Y = 5;
    var SIGNATURE_SCALAR = 6;

    // The message is an array of 10 parts.
    signal input message[MESSAGE_PARTS];
    // The encryption private key
    signal input encryptionPrivateKey;
    // The encryption public key
    signal input encryptionPublicKey[2];

    // Command parts.
    signal output stateIndex;
    // The new public key.
    signal output newPublicKey[2];
    // The vote option index.
    signal output voteOptionIndex;
    // The new vote weight.
    signal output newVoteWeight;
    // The nonce.
    signal output nonce;
    // The poll id.
    signal output pollId;
    // The salt.
    signal output salt;
    // The signature point.
    signal output signaturePoint[2];
    // The signature scalar.
    signal output signatureScalar;

    // Packed command. 
    signal output packedCommandOut[PACKED_COMMAND_LENGTH];

    // Generate the shared key for decrypting the message.
    var computedEcdh[2] = Ecdh()(encryptionPrivateKey, encryptionPublicKey);

    // Decrypt the message using Poseidon decryption.
    var computedDecryptor[DECRYPTED_LENGTH] = PoseidonDecryptWithoutCheck(MESSAGE_LENGTH)(
        message,
        0, 
        computedEcdh
    );

    // Save the decrypted message into a packed command signal.
    signal packedCommand[PACKED_COMMAND_LENGTH];

    for (var i = 0; i < PACKED_COMMAND_LENGTH; i++) {
        packedCommand[i] <== computedDecryptor[i];
    }

    var computedUnpackElement[UNPACK_ELEMENT_LENGTH] = UnpackElement(UNPACK_ELEMENT_LENGTH)(
        packedCommand[COMMAND_STATE_INDEX]
    );

    // Everything below were packed into the first element.
    pollId <== computedUnpackElement[ELEMENT_POLL_ID];
    nonce <== computedUnpackElement[ELEMENT_NONCE];
    newVoteWeight <== computedUnpackElement[ELEMENT_NEW_VOTE_WEIGHT];
    voteOptionIndex <== computedUnpackElement[ELEMENT_VOTE_OPTION_INDEX];
    stateIndex <== computedUnpackElement[ELEMENT_STATE_INDEX];

    newPublicKey[0] <== packedCommand[COMMAND_PUBLIC_KEY_X];
    newPublicKey[1] <== packedCommand[COMMAND_PUBLIC_KEY_Y];
    salt <== packedCommand[COMMAND_SALT];

    signaturePoint[0] <== computedDecryptor[SIGNATURE_POINT_X];
    signaturePoint[1] <== computedDecryptor[SIGNATURE_POINT_Y];
    signatureScalar <== computedDecryptor[SIGNATURE_SCALAR];

    packedCommandOut <== packedCommand;
}
