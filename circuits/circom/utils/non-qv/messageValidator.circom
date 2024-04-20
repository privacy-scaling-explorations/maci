pragma circom 2.0.0;

// local imports
include "../verifySignature.circom";

// zk-kit imports
include "./safe-comparators.circom";

/**
 * Checks if a MACI message is valid or not.
 * This template does not support the Quadratic Voting (QV).
 */
template MessageValidatorNonQv() {
    // Length of the packed command.
    var PACKED_CMD_LENGTH = 4;

    // State index of the user.
    signal input stateTreeIndex;
    // Number of user sign-ups in the state tree.
    signal input numSignUps;
    // Vote option index.
    signal input voteOptionIndex;
    // Maximum number of vote options.
    signal input maxVoteOptions;
    // Ballot nonce.
    signal input originalNonce;
    // Command nonce.
    signal input nonce;
    // Packed command.
    signal input cmd[PACKED_CMD_LENGTH];
    // Public key of the state leaf (user).
    signal input pubKey[2];
    // ECDSA signature of the command (R part).
    signal input sigR8[2];
    // ECDSA signature of the command (S part).
    signal input sigS;
    // State leaf signup timestamp.
    signal input slTimestamp;
    // Timestamp indicating when the poll ends.
    signal input pollEndTimestamp;
    // State leaf current voice credit balance.
    signal input currentVoiceCreditBalance;
    // Current number of votes for specific option. 
    signal input currentVotesForOption;
    // Vote weight.
    signal input voteWeight;

    // True when the command is valid; otherwise false.
    signal output isValid;

    // Check (1) - The state leaf index must be valid.
    // The check ensure that the stateTreeIndex <= numSignUps as first validation.
    // Must be <= because the stateTreeIndex is 1-based. Zero is for blank state leaf
    // while 1 is for the first actual user matching the numSignUps start.
    var validStateLeafIndex = SafeLessEqThan(252)([stateTreeIndex, numSignUps]);

    // Check (2) - The max vote option tree index must be correct.
    var validVoteOptionIndex = SafeLessThan(252)([voteOptionIndex, maxVoteOptions]);

    // Check (3) - The nonce must be correct.    
    var validNonce = IsEqual()([originalNonce + 1, nonce]);

    // Check (4) - The signature must be correct.    
    var validSignature = VerifySignature()(pubKey, sigR8, sigS, cmd);

    // Check (5) - The state leaf must be inserted before the Poll period end.    
    var validTimestamp = SafeLessEqThan(252)([slTimestamp, pollEndTimestamp]);
 
    // Check (6) - There must be sufficient voice credits.
    // The check ensure that currentVoiceCreditBalance + (currentVotesForOption) >= (voteWeight).
    var sufficientVoiceCredits = SafeGreaterEqThan(252)(
        [
            currentVotesForOption + currentVoiceCreditBalance,
            voteWeight
        ]
    );

    // When all six checks are correct, then isValid = 1.
    var validUpdate = IsEqual()(
        [
            6,
            validSignature + 
            sufficientVoiceCredits +
            validNonce +
            validStateLeafIndex +
            validTimestamp +
            validVoteOptionIndex
        ]
    );

    isValid <== validUpdate;
}
