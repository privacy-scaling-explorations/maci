include "./messageValidator.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

template StateLeafAndBallotTransformer() {
    var PACKED_CMD_LENGTH = 4;

    // For the MessageValidator
    signal input maxUsers;
    signal input maxVoteOptions;

    // State leaf
    signal input slPubKey[2];
    signal input slVoiceCreditBalance;

    // Ballot
    signal input ballotNonce;
    signal input ballotVoteOptionRoot;
    signal input ballotCurrentVotesForOption;

    // Command
    signal input cmdStateIndex;
    signal input cmdNewPubKey[2];
    signal input cmdVoteOptionIndex;
    signal input cmdNewVoteWeight;
    signal input cmdNonce;
    signal input cmdPollId;
    signal input cmdSalt;
    signal input cmdSigR8[2];
    signal input cmdSigS;
    // Note: we assume that packedCommand is valid!
    signal input packedCommand[PACKED_CMD_LENGTH];

    signal input updatedBallotVoteOptionRoot;

    // New state leaf (if the command is valid)
    signal output newSlPubKey[2];
    signal output newSlVoiceCreditBalance;

    // New ballot (if the command is valid)
    signal output newBallotNonce;
    signal output newBallotVoteOptionRoot;
    signal output isValid;

    signal newVoiceCreditBalance;
    signal b;
    signal c;
    b <== ballotCurrentVotesForOption * ballotCurrentVotesForOption;
    c <== cmdNewVoteWeight * cmdNewVoteWeight;
    newVoiceCreditBalance <== slVoiceCreditBalance + b - c;

    // Check if the command / message is valid
    component messageValidator = MessageValidator();
    messageValidator.stateTreeIndex <== cmdStateIndex;
    messageValidator.maxUsers <== maxUsers;
    messageValidator.voteOptionIndex <== cmdVoteOptionIndex;
    messageValidator.maxVoteOptions <== maxVoteOptions;
    messageValidator.originalNonce <== ballotNonce;
    messageValidator.nonce <== cmdNonce;
    for (var i = 0; i < PACKED_CMD_LENGTH; i ++) {
        messageValidator.cmd[i] <== packedCommand[i];
    }
    messageValidator.pubKey[0] <== cmdNewPubKey[0];
    messageValidator.pubKey[1] <== cmdNewPubKey[1];
    messageValidator.sigR8[0] <== cmdSigR8[0];
    messageValidator.sigR8[1] <== cmdSigR8[1];
    messageValidator.sigS <== cmdSigS;

    messageValidator.currentVoiceCreditBalance <== slVoiceCreditBalance;
    messageValidator.currentVotesForOption <== ballotCurrentVotesForOption;
    messageValidator.voteWeight <== cmdNewVoteWeight;

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

    component newSlVoiceCreditBalanceMux = Mux1();
    newSlVoiceCreditBalanceMux.s <== messageValidator.isValid;
    newSlVoiceCreditBalanceMux.c[0] <== slVoiceCreditBalance;
    newSlVoiceCreditBalanceMux.c[1] <== newVoiceCreditBalance;
    newSlVoiceCreditBalance <== newSlVoiceCreditBalanceMux.out;

    component newBallotNonceMux = Mux1();
    newBallotNonceMux.s <== messageValidator.isValid;
    newBallotNonceMux.c[0] <== ballotNonce;
    newBallotNonceMux.c[1] <== cmdNonce;
    newBallotNonce <== newBallotNonceMux.out;

    component newBallotVoteOptionRootMux = Mux1();
    newBallotVoteOptionRootMux.s <== messageValidator.isValid;
    newBallotVoteOptionRootMux.c[0] <== ballotVoteOptionRoot;
    newBallotVoteOptionRootMux.c[1] <== updatedBallotVoteOptionRoot;
    newBallotVoteOptionRoot <== newBallotVoteOptionRootMux.out;

    isValid <== messageValidator.isValid;

}
