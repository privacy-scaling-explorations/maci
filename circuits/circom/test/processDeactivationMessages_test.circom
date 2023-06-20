pragma circom 2.0.0;
include "../processDeactivationMessages.circom";

component main {public [inputHash]} = ProcessDeactivationMessages(3, 10);