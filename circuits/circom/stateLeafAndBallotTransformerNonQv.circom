pragma circom 2.0.0;

// circomlib import
include "./mux1.circom";

// local import
include "./messageValidatorNonQv.circom";

// Apply a command to a state leaf and ballot.
template StateLeafAndBallotTransformerNonQv() {
    var PACKED_CMD_LENGTH = 4;

    // For the MessageValidator
    // how many users signed up
    signal input numSignUps;
    // what is the maximum number of vote options
    signal input maxVoteOptions;

    // State leaf
    // the public key of the signed up user
    signal input slPubKey[2];
    // the current voice credit balance of the signed up user
    signal input slVoiceCreditBalance;
    // the signup timestmap
    signal input slTimestamp;
    // when the poll ends
    signal input pollEndTimestamp;

    // Ballot
    // the nonce of the ballot
    signal input ballotNonce;
    // the vote for this option 
    signal input ballotCurrentVotesForOption;

    // Command
    // state index of the user
    signal input cmdStateIndex;
    // the pub key 
    signal input cmdNewPubKey[2];
    // the vote option index
    signal input cmdVoteOptionIndex;
    // the vote weight
    signal input cmdNewVoteWeight;
    // the nonce of the command
    signal input cmdNonce;
    // the id of the poll for which this command is for
    signal input cmdPollId;
    // the salt of the command
    signal input cmdSalt;
    // the ECDSA signature of the command
    // r part 
    signal input cmdSigR8[2];
    // s part 
    signal input cmdSigS;
    // @note we assume that packedCommand is valid!
    signal input packedCommand[PACKED_CMD_LENGTH];

    // New state leaf (if the command is valid)
    signal output newSlPubKey[2];

    // New ballot (if the command is valid)
    signal output newBallotNonce;
    signal output isValid;

    // Check if the command / message is valid
    component messageValidator = MessageValidatorNonQv();
    messageValidator.stateTreeIndex <== cmdStateIndex;
    messageValidator.numSignUps <== numSignUps;
    messageValidator.voteOptionIndex <== cmdVoteOptionIndex;
    messageValidator.maxVoteOptions <== maxVoteOptions;
    messageValidator.originalNonce <== ballotNonce;
    messageValidator.nonce <== cmdNonce;
    for (var i = 0; i < PACKED_CMD_LENGTH; i++) {
        messageValidator.cmd[i] <== packedCommand[i];
    }
    messageValidator.pubKey[0] <== slPubKey[0];
    messageValidator.pubKey[1] <== slPubKey[1];
    messageValidator.sigR8[0] <== cmdSigR8[0];
    messageValidator.sigR8[1] <== cmdSigR8[1];
    messageValidator.sigS <== cmdSigS;

    messageValidator.currentVoiceCreditBalance <== slVoiceCreditBalance;
    messageValidator.slTimestamp <== slTimestamp;
    messageValidator.pollEndTimestamp <== pollEndTimestamp;
    messageValidator.currentVotesForOption <== ballotCurrentVotesForOption;
    messageValidator.voteWeight <== cmdNewVoteWeight;

    // if the message is valid then we swap out the public key
    // we have to do this in two Mux one for pucKey[0]
    // and one for pubKey[1]
    component newSlPubKey0Mux = Mux1();
    newSlPubKey0Mux.s <== messageValidator.isValid;
    newSlPubKey0Mux.c[0] <== slPubKey[0];
    newSlPubKey0Mux.c[1] <== cmdNewPubKey[0];
    newSlPubKey[0] <== newSlPubKey0Mux.out;

    component newSlPubKey1Mux = Mux1();
    newSlPubKey1Mux.s <== messageValidator.isValid;
    newSlPubKey1Mux.c[0] <== slPubKey[1];
    newSlPubKey1Mux.c[1] <== cmdNewPubKey[1];
    newSlPubKey[1] <== newSlPubKey1Mux.out;

    // if the message is valid then we swap out the ballot nonce
    component newBallotNonceMux = Mux1();
    newBallotNonceMux.s <== messageValidator.isValid;
    newBallotNonceMux.c[0] <== ballotNonce;
    newBallotNonceMux.c[1] <== cmdNonce;
    newBallotNonce <== newBallotNonceMux.out;

    isValid <== messageValidator.isValid;
}
