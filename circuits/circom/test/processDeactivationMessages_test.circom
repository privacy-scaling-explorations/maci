pragma circom 2.0.0;
include "../processDeactivationMessages.circom";

component main {public [deactivatedTreeRoot, numSignUps, currentStateRoot]} = ProcessDeactivationMessages(10, 10);