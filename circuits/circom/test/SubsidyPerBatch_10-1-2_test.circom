pragma circom 2.0.0;

include "../subsidy.circom";

component main {public [inputHash]} = SubsidyPerBatch(10, 1, 2);
