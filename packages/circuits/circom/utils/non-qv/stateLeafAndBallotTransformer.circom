pragma circom 2.0.0;

// circomlib import
include "./mux1.circom";
// local import
include "./messageValidator.circom";

/**
 * Processes a command by verifying its validity and updates the state leaf and ballot accordingly. 
 * If the message is correct, updates the public key in the state leaf and the nonce 
 * in the ballot using multiplexer components.
 * This template does not support Quadratic Voting (QV).
 */
template StateLeafAndBallotTransformerNonQv() {
    // Length of the packed command.
    var PACKED_CMD_LENGTH = 4;

    // Number of user sign-ups in the state tree.
    signal input numSignUps;
    // Maximum number of vote options.
    signal input maxVoteOptions;

    // The following signals represents a state leaf (signed up user).
    // Public key.
    signal input slPubKey[2];
    // Current voice credit balance.
    signal input slVoiceCreditBalance;
    // Signup timestamp.
    signal input slTimestamp;
    // Timestamp indicating when the poll ends.
    signal input pollEndTimestamp;

    // The following signals represents a ballot.
    // Nonce.
    signal input ballotNonce;
    // Current number of votes for specific option. 
    signal input ballotCurrentVotesForOption;

    // The following signals represents a command.
    // State index of the user.
    signal input cmdStateIndex;
    // Public key of the user.
    signal input cmdNewPubKey[2];
    // Vote option index.
    signal input cmdVoteOptionIndex;
    // Vote weight.
    signal input cmdNewVoteWeight;
    // Nonce.
    signal input cmdNonce;
    // Poll identifier.
    signal input cmdPollId;
    // Salt.
    signal input cmdSalt;
    // ECDSA signature of the command (R part).
    signal input cmdSigR8[2];
    // ECDSA signature of the command (S part).
    signal input cmdSigS;
    // Packed command. 
    // nb. we are assuming that the packedCommand is always valid.
    signal input packedCommand[PACKED_CMD_LENGTH];

    // New state leaf (if the command is valid).
    signal output newSlPubKey[2];
    // New ballot (if the command is valid).
    signal output newBallotNonce;
    
    // True when the command is valid; otherwise false.
    signal output isValid;
    // True if the state leaf index is valid
    signal output isStateLeafIndexValid;
    // True if the vote option index is valid
    signal output isVoteOptionIndexValid;

    // Check if the command / message is valid.
    var (computedMessageValidator, computedIsStateLeafIndexValid, computedIsVoteOptionIndexValid) = MessageValidatorNonQv()(
        cmdStateIndex,
        numSignUps,
        cmdVoteOptionIndex,
        maxVoteOptions,
        ballotNonce,
        cmdNonce,
        packedCommand,
        slPubKey,
        cmdSigR8,
        cmdSigS,
        slTimestamp,
        pollEndTimestamp,
        slVoiceCreditBalance,
        ballotCurrentVotesForOption,
        cmdNewVoteWeight
    );

    // If the message is valid then we swap out the public key.
    // This means using a Mux1() for pubKey[0] and another one
    // for pubKey[1].
    var computedNewSlPubKey0Mux = Mux1()([slPubKey[0], cmdNewPubKey[0]], computedMessageValidator);
    var computedNewSlPubKey1Mux = Mux1()([slPubKey[1], cmdNewPubKey[1]], computedMessageValidator);

    newSlPubKey[0] <== computedNewSlPubKey0Mux;
    newSlPubKey[1] <== computedNewSlPubKey1Mux;

    // If the message is valid, then we swap out the ballot nonce
    // using a Mux1().
    var computedNewBallotNonceMux = Mux1()([ballotNonce, cmdNonce], computedMessageValidator);

    newBallotNonce <== computedNewBallotNonceMux;

    isValid <== computedMessageValidator;
    isStateLeafIndexValid <== computedIsStateLeafIndexValid;
    isVoteOptionIndexValid <== computedIsVoteOptionIndexValid;
}