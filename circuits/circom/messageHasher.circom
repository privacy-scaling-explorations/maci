include "./hasherSha256.circom";
include "./hasherPoseidon.circom";

template MessageHasher() {
    signal input in[8];
    signal output hash;

    component hasher = Sha256Hasher8();

    for (var i = 0; i < 8; i ++) {
        hasher.in[i] <== in[i];
    }

    hash <== hasher.hash;
}

/*template MessageHasher() {*/
    /*signal input in[8];*/
    /*signal output hash;*/

    /*component hash4 = Hasher4();*/
    /*component hash5 = Hasher5();*/

    /*hash5.in[0] <== in[0];*/
    /*hash5.in[1] <== in[1];*/
    /*hash5.in[2] <== in[2];*/
    /*hash5.in[3] <== in[3];*/
    /*hash5.in[4] <== in[4];*/

    /*hash4.in[0] <== hash5.hash;*/
    /*hash4.in[1] <== in[5];*/
    /*hash4.in[2] <== in[6];*/
    /*hash4.in[3] <== in[7];*/

    /*hash <== hash4.hash;*/
/*}*/
