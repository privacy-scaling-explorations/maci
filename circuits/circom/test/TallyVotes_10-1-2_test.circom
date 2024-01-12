pragma circom 2.0.0;

include "../tallyVotes.circom";

component main {public [inputHash]} = TallyVotes(10, 1, 2);
