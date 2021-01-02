include "./ecdh.circom";
include "./decrypt.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template MessageToCommand() {
    var MSG_LENGTH = 8;
    var PACKED_CMD_LENGTH = 4;
    var UNPACKED_CMD_LENGTH = 8;

    signal input message[8];
    signal input encPrivKey;
    signal input encPubKey[2];

    component ecdh = Ecdh();
    ecdh.privKey <== encPrivKey;
    ecdh.pubKey[0] <== encPubKey[0];
    ecdh.pubKey[1] <== encPubKey[1];

    component decryptor = Decrypt(MSG_LENGTH - 1);
    decryptor.privKey <== ecdh.sharedKey;
    for (var i = 0; i < MSG_LENGTH; i++) {
        decryptor.message[i] <== message[i];
    }

    signal packedCommand[PACKED_CMD_LENGTH];
    for (var i = 0; i < PACKED_CMD_LENGTH; i ++) {
        packedCommand[i] <== decryptor.out[i];
    }

    component n2b = Num2Bits(250);
    n2b.in <== packedCommand[0];

    // packedCommand[0] is a packed value
    // bits 0 - 50:    stateIndex
    // bits 51 - 100:  voteOptionIndex
    // bits 101 - 150: newVoteWeight
    // bits 151 - 200: nonce
    // bits 201 - 250: pollId
    component stateIndexB2N = Bits2Num(50);
    component voteOptionIndexB2N = Bits2Num(50);
    component newVoteWeightB2N = Bits2Num(50);
    component nonceB2N = Bits2Num(50);
    component pollIdB2N = Bits2Num(50);

    for (var i = 0; i < 50; i ++) {
        stateIndexB2N.in[i] <== n2b.out[i];
        voteOptionIndexB2N.in[i] <== n2b.out[i + 50];
        newVoteWeightB2N.in[i] <== n2b.out[i + 100];
        nonceB2N.in[i] <== n2b.out[i + 150];
        pollIdB2N.in[i] <== n2b.out[i + 200];
    }

    signal output stateIndex;
    signal output newPubKey[2];
    signal output voteOptionIndex;
    signal output newVoteWeight;
    signal output nonce;
    signal output pollId;
    signal output salt;
    signal output sigR8[2];
    signal output sigS;

    stateIndex <== stateIndexB2N.out;
    voteOptionIndex <== voteOptionIndexB2N.out;
    newVoteWeight <== newVoteWeightB2N.out;
    nonce <== nonceB2N.out;
    pollId <== pollIdB2N.out;
    newPubKey[0] <== packedCommand[1];
    newPubKey[1] <== packedCommand[2];
    salt <== packedCommand[3];

    sigR8[0] <== decryptor.out[4];
    sigR8[1] <== decryptor.out[5];
    sigS <== decryptor.out[6];
}
