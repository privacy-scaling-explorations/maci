pragma circom 2.0.0;
include "../generateKeyFromDeactivated.circom";

component main { public [inputHash] } = GenerateKeyFromDeactivated(10);
