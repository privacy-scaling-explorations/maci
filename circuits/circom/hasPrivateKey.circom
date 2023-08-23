pragma circom 2.0.0;

include "./privToPubKey.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template HasPrivateKey() {
    signal input privKey;
    signal input pubKey[2];
    signal output isKeyCorrect;

    // Compute public key based on the provided private key
    component privToPub = PrivToPubKey();
    privToPub.privKey <== privKey;

    // Compare coordinates of the derived public key against the provided one
    component areKeysEqual0 = IsEqual();
    component areKeysEqual1 = IsEqual();

    areKeysEqual0.in[0] <== pubKey[0];
    areKeysEqual0.in[1] <== privToPub.pubKey[0];

    areKeysEqual1.in[0] <== pubKey[1];
    areKeysEqual1.in[1] <== privToPub.pubKey[1];

    // Both checks have to return 1 to successfuly verify the key
    isKeyCorrect <== areKeysEqual0.out * areKeysEqual1.out;
}