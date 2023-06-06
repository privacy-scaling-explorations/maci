pragma circom 2.0.0;
include "../isDeactivatedKey.circom";

component main { public [key, root]} = IsDeactivatedKey(3);
