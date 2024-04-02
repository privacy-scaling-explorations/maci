pragma circom 2.0.0;

// from @zk-kit/circuits package.
include "./safe-comparators.circom";
// local.
include "./verifySignature.circom";

/**
 * Checks if a MACI message is valid or not.
 * This template does not support the Quadratic Voting (QV).
 */
template MessageValidatorNonQv() {
    var PACKED_CMD_LENGTH = 4;

    signal input stateTreeIndex;
    // Number of signups in the state tree.
    signal input numSignUps;
    signal input voteOptionIndex;
    signal input maxVoteOptions;
    signal input originalNonce;
    signal input nonce;
    signal input cmd[PACKED_CMD_LENGTH];
    signal input pubKey[2];
    signal input sigR8[2];
    signal input sigS;
    signal input slTimestamp;
    signal input pollEndTimestamp;
    signal input currentVoiceCreditBalance;
    signal input currentVotesForOption;
    signal input voteWeight;
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
