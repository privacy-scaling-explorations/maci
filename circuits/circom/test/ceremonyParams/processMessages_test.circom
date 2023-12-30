pragma circom 2.0.0;
include "../../processMessages.circom";
/*
stateTreeDepth,
msgTreeDepth,
msgSubTreeDepth
voteOptionTreeDepth,
*/

component main {public [inputHash]} = ProcessMessages(6, 8, 2, 3);
