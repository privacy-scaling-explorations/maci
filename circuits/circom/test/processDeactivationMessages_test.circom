pragma circom 2.0.0;
include "../processDeactivationMessage.circom";

component main {public [deactivatedTreeRoot]} = ProcessDeactivationMessages(10, 10);