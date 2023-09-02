pragma circom 2.0.0;
include "./isDeactivatedKey.circom";
include "./privToPubKey.circom"
include "./poseidon/poseidonHashT3.circom";

template verifyDeactivatedKey(treeLevels) {
    var LEAVES_PER_NODE = 5;
    var LEAVES_PER_PATH_LEVEL = LEAVES_PER_NODE - 1;

    signal input deactivatedKeysRoot;
    signal input oldPrivKey;
    signal input c1;
    signal input c2;
    signal input path_index[treeLevels];
    signal input path_elements[levels][LEAVES_PER_PATH_LEVEL];

    signal output encMessage;
    signal output c1r;
    signal output c2r;
    signal output nullifier;

    component privToPub = PrivToPubKey(); 
    component privToPub.privKey <== oldPrivKey;

    // Derive public key from private key
    signal oldPubKey[2];
    oldPubKey[0] <== privToPub.pubKey[0];
    oldPubKey[1] <== privToPub.pubKey[1];

    // Check if the old public key is in deactivated keys set
    component keyInTree = isDeactivatedKey(treeLevels);
    keyInTree.root <== deactivatedKeysRoot;
    keyInTree.key[0] <== oldPubKey[0];
    keyInTree.key[1] <== oldPubKey[1];
    keyInTree.c1 <== c1;
    keyInTree.c2 <== c2;
    
    for (var i = 0; i < treeLevels; i ++) {
        keyInTree.path_index[i] <== path_index[i];
    }

    for (var i = 0; i < levels; i++) {
        for (var j = 0; j < LEAVES_PER_PATH_LEVEL; j++) {
            keyInTree.path_elements[i][j] <== path_elements[i][j];
        }
    }

    // Compute nullifier as hash(oldPrivKey, pubKey[0], pubKey[1])
    component nullifierHasher = PoseidonHashT4();
    nullifierHasher.in[0] <== oldPrivKey;
    nullifierHasher.in[1] <== oldPubKey[0];
    nullifierHasher.in[2] <== oldPubKey[1];
    nullifier <== nullifierHasher.out;
}
