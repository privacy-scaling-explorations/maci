pragma circom 2.0.0;

include "../processMessages.circom";

/*
stateTreeDepth,
msgTreeDepth,
msgSubTreeDepth
voteOptionTreeDepth,
*/

component main {public [inputHash]} = ProcessMessages(10, 2, 1, 2);
