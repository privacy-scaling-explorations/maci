include "./verifySignature.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template MessageValidator() {
    // a) Whether the state leaf index is valid
    signal input stateTreeIndex;
    signal input maxUsers;
    component validStateLeafIndex = LessEqThan(32);
    validStateLeafIndex.in[0] <== stateTreeIndex;
    validStateLeafIndex.in[1] <== maxUsers;

    // b) Whether the max vote option tree index is correct
    signal input voteOptionsIndex;
    signal input maxVoteOptions;
    component validVoteOptionsIndex = LessEqThan(32);
    validVoteOptionsIndex.in[0] <== voteOptionsIndex;
    validVoteOptionsIndex.in[1] <== maxVoteOptions;

    // c) Whether the nonce is correct
    signal input originalNonce;
    signal input nonce;
    component validNonce = IsEqual();
    validNonce.in[0] <== originalNonce + 1;
    validNonce.in[1] <== nonce;

    var CMD_LENGTH = 4;
    // d) Whether the signature is correct
    signal input cmd[CMD_LENGTH];
    signal input pubKey[2];
    signal input sigR8x;
    signal input sigR8y;
    signal input sigS;

    component validSignature = VerifySignature();
    validSignature.pubKey[0] <== pubKey[0];
    validSignature.pubKey[1] <== pubKey[1];
    validSignature.R8x <== sigR8x;
    validSignature.R8y <== sigR8y;
    validSignature.S <== sigS;
    for (var i = 0; i < CMD_LENGTH; i ++) {
        validSignature.preimage[i] <== cmd[i];
    }

    // e) Whether there are sufficient voice credits
    signal input currentVoiceCreditBalance;
    signal input currentVotesForOption;
    signal input voteWeight;

    // Check that currentVoiceCreditBalance + (currentVotesForOption ** 2) >= (voteWeight ** 2)
    component sufficientVoiceCredits = GreaterEqThan(32);
    sufficientVoiceCredits.in[0] <== (currentVotesForOption * currentVotesForOption) + currentVoiceCreditBalance;
    sufficientVoiceCredits.in[1] <== voteWeight * voteWeight;

    component validUpdate = IsEqual();
    validUpdate.in[0] <== 5;
    validUpdate.in[1] <== validSignature.valid + 
                          sufficientVoiceCredits.out +
                          validNonce.out +
                          validStateLeafIndex.out +
                          validVoteOptionsIndex.out;
    signal output isValid;
    isValid <== validUpdate.out;

    // For debugging
    /*signal output isValidSignature;*/
    /*signal output isValidVc;*/
    /*signal output isValidNonce;*/
    /*signal output isValidSli;*/
    /*signal output isValidVoi;*/

    /*isValidSignature <== validSignature.valid;*/
    /*isValidVc <== sufficientVoiceCredits.out;*/
    /*isValidNonce <== validNonce.out;*/
    /*isValidSli <== validStateLeafIndex.out;*/
    /*isValidVoi <== validVoteOptionsIndex.out;*/
}
