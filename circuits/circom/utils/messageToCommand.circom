pragma circom 2.0.0;


// from @zk-kit/circuits package.
include "./ecdh.circom";
include "./unpack-element.circom";
include "./poseidon-cipher.circom";
// from circomlib.
include "./bitify.circom";
// local.
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
    var MESSAGE_PARTS = 11;

    // The message is an array of 11 parts.
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
    var ecdh[2] = Ecdh()(encPrivKey, encPubKey);

    // Decrypt the message using Poseidon decryption.
    var decryptor[DECRYPTED_LENGTH] = PoseidonDecryptWithoutCheck(MSG_LENGTH)(
        [
            // nb. the first one is the msg type => skip.
            message[1], message[2], message[3], message[4],
            message[5], message[6], message[7], message[8],
            message[9], message[10]            
        ],
        0, 
        ecdh
    );

    // Save the decrypted message into a packed command signal.
    signal packedCommand[PACKED_CMD_LENGTH];
    for (var i = 0; i < PACKED_CMD_LENGTH; i++) {
        packedCommand[i] <== decryptor[i];
    }

    var unpack[UNPACK_ELEM_LENGTH] = UnpackElement(UNPACK_ELEM_LENGTH)(packedCommand[0]);

    // Everything below were packed into the first element.
    stateIndex <== unpack[4];
    voteOptionIndex <== unpack[3];
    newVoteWeight <== unpack[2];
    nonce <== unpack[1];
    pollId <== unpack[0];

    newPubKey[0] <== packedCommand[1];
    newPubKey[1] <== packedCommand[2];
    salt <== packedCommand[3];

    sigR8[0] <== decryptor[4];
    sigR8[1] <== decryptor[5];
    sigS <== decryptor[6];

    packedCommandOut <== packedCommand;
}
