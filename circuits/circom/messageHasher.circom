pragma circom 2.0.0;

// local import
include "./poseidonHash.circom";

// hash a MACI message together with the public key
// used to encrypt the message
template MessageHasher() {
    // 11 inputs are the MACI message
    signal input in[11];
    // the public key used to encrypt the message
    signal input encPubKey[2];
    // we output an hash 
    signal output hash;

    // Hasher5(
    //     in[0]
    //     Hasher5_1(in[1], in[2], in[3], in[4], in[5]),
    //     Hasher5_2(in[6], in[7], in[8], in[9], in[10])
    //     in[11],
    //     in[12]
    // )

    var hasher5_1;
    hasher5_1 = PoseidonHash(5)([
        in[1],
        in[2],
        in[3],
        in[4],
        in[5]
    ]);

    var hasher5_2;
    hasher5_2 = PoseidonHash(5)([
        in[6],        
        in[7],
        in[8],
        in[9],
        in[10]
    ]);

    hash <== PoseidonHash(5)([
        in[0],
        hasher5_1,
        hasher5_2,
        encPubKey[0],
        encPubKey[1]        
    ]);
}
