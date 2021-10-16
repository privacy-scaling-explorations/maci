pragma circom 2.0.0;
include "../verifySignature.circom";

component main {public [pubKey, R8, S]} = VerifySignature();
