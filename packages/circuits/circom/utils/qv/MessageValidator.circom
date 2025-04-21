pragma circom 2.0.0;

// zk-kit imports
include "./safe-comparators.circom";
// local imports
include "../VerifySignature.circom";

/**
 * Checks if a MACI message is valid or not.
 * This template supports the Quadratic Voting (QV).
 */
template MessageValidator() {
    // Length of the packed command.
    var PACKED_COMMAND_LENGTH = 4;
    // Number of checks to be performed.
    var TOTAL_CHECKS = 6;

    // State index of the user.
    signal input stateTreeIndex;
    // Number of user sign-ups in the state tree.
    signal input totalSignups;
    // Vote option index.
    signal input voteOptionIndex;
    // Number of valid vote options for the poll.
    signal input voteOptions;
    // Ballot nonce.
    signal input originalNonce;
    // Command nonce.
    signal input nonce;
    // Packed command.
    signal input command[PACKED_COMMAND_LENGTH];
    // Public key of the state leaf (user).
    signal input publicKey[2];
    // ECDSA signature of the command (R part).
    signal input signaturePoint[2];
    // ECDSA signature of the command (S part).
    signal input signatureScalar;
    // State leaf current voice credit balance.
    signal input currentVoiceCreditBalance;
    // Current number of votes for specific option. 
    signal input currentVotesForOption;
    // Vote weight.
    signal input voteWeight;

    // True when the command is valid; otherwise false.
    signal output isValid;
    // True if the state leaf index is valid
    signal output isStateLeafIndexValid;
    // True if the vote option index is valid
    signal output isVoteOptionIndexValid;

    // Check (1) - The state leaf index must be valid.
    // The check ensure that the stateTreeIndex < totalSignups as first validation.
    // Must be < because the stateTreeIndex is 0-based. Zero is for blank state leaf
    // while 1 is for the first actual user.
    var computedIsStateLeafIndexValid = SafeLessThan(252)([stateTreeIndex, totalSignups]);

    // Check (2) - The vote option index must be less than the number of valid vote options (0 indexed).
    var computedIsVoteOptionIndexValid = SafeLessThan(252)([voteOptionIndex, voteOptions]);

    // Check (3) - The nonce must be correct.    
    var computedIsNonceValid = IsEqual()([originalNonce + 1, nonce]);

    // Check (4) - The signature must be correct.    
    var computedIsSignatureValid = VerifySignature()(publicKey, signaturePoint, signatureScalar, command);

    // Check (5) - There must be sufficient voice credits.
    // The check ensure that the voteWeight is < sqrt(field size)
    // so that voteWeight ^ 2 will not overflow.
    var computedIsVoteWeightValid = SafeLessEqThan(252)([voteWeight, 147946756881789319005730692170996259609]);

    // Check (6) - Check the current voice credit balance.
    // The check ensure that currentVoiceCreditBalance + (currentVotesForOption ** 2) >= (voteWeight ** 2)
    var computedAreVoiceCreditsSufficient = SafeGreaterEqThan(252)(
        [
            (currentVotesForOption * currentVotesForOption) + currentVoiceCreditBalance,
            voteWeight * voteWeight
        ]
    );

    // When all six checks are correct, then isValid = 1.
    var computedIsUpdateValid = IsEqual()(
        [
            TOTAL_CHECKS,
            computedIsSignatureValid + 
            computedAreVoiceCreditsSufficient +
            computedIsVoteWeightValid +
            computedIsNonceValid +
            computedIsStateLeafIndexValid +
            computedIsVoteOptionIndexValid
        ]
    );

    isValid <== computedIsUpdateValid;
    isStateLeafIndexValid <== computedIsStateLeafIndexValid;
    isVoteOptionIndexValid <== computedIsVoteOptionIndexValid;
}
