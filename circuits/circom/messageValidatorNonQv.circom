pragma circom 2.0.0;

// local imports
include "./verifySignature.circom";
include "./utils.circom";

// template that validates whether a message
// is valid or not 
// @note it does not do quadratic voting
template MessageValidatorNonQv() {
    // a) Whether the state leaf index is valid
    signal input stateTreeIndex;
    // how many signups we have in the state tree
    signal input numSignUps;
    // we check that the state tree index is <= than the number of signups
    // as first validation
    // it is <= because the state tree index is 1-based
    // 0 is for blank state leaf then 1 for the first actual user
    // which is where the numSignUps starts
    component validStateLeafIndex = SafeLessEqThan(252);
    validStateLeafIndex.in[0] <== stateTreeIndex;
    validStateLeafIndex.in[1] <== numSignUps;

    // b) Whether the max vote option tree index is correct
    signal input voteOptionIndex;
    signal input maxVoteOptions;
    component validVoteOptionIndex = SafeLessThan(252);
    validVoteOptionIndex.in[0] <== voteOptionIndex;
    validVoteOptionIndex.in[1] <== maxVoteOptions;

    // c) Whether the nonce is correct
    signal input originalNonce;
    signal input nonce;
    component validNonce = IsEqual();
    // the nonce should be previous nonce + 1
    validNonce.in[0] <== originalNonce + 1;
    validNonce.in[1] <== nonce;

    var PACKED_CMD_LENGTH = 4;
    // d) Whether the signature is correct
    signal input cmd[PACKED_CMD_LENGTH];
    signal input pubKey[2];
    signal input sigR8[2];
    signal input sigS;

    component validSignature = VerifySignature();
    validSignature.pubKey[0] <== pubKey[0];
    validSignature.pubKey[1] <== pubKey[1];
    validSignature.R8[0] <== sigR8[0];
    validSignature.R8[1] <== sigR8[1];
    validSignature.S <== sigS;
    for (var i = 0; i < PACKED_CMD_LENGTH; i++) {
        validSignature.preimage[i] <== cmd[i];
    }

    // e) Whether the state leaf was inserted before the Poll period ended
    signal input slTimestamp;
    signal input pollEndTimestamp;
    component validTimestamp = SafeLessEqThan(252);
    validTimestamp.in[0] <== slTimestamp;
    validTimestamp.in[1] <== pollEndTimestamp;

    // f) Whether there are sufficient voice credits
    signal input currentVoiceCreditBalance;
    signal input currentVotesForOption;
    signal input voteWeight;

    // Check that currentVoiceCreditBalance + (currentVotesForOption) >= (voteWeight)
    component sufficientVoiceCredits = SafeGreaterEqThan(252);
    sufficientVoiceCredits.in[0] <== currentVotesForOption + currentVoiceCreditBalance;
    sufficientVoiceCredits.in[1] <== voteWeight;

    // if all 6 checks are correct then is IsValid = 1
    component validUpdate = IsEqual();
    validUpdate.in[0] <== 6;
    validUpdate.in[1] <== validSignature.valid + 
                          sufficientVoiceCredits.out +
                          validNonce.out +
                          validStateLeafIndex.out +
                          validTimestamp.out +
                          validVoteOptionIndex.out;
    signal output isValid;
    isValid <== validUpdate.out;
}
