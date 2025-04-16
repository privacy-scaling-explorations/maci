pragma circom 2.0.0;

include "./PoseidonHasher.circom";

/**
 * Hashes a MACI message and the public key used for message encryption. 
 * This template processes 10 message inputs and a 2-element public key
 * combining them using the Poseidon hash function. The hashing process involves two stages: 
 * 1. hashing message parts data groups of five and,
 * 2. hashing the grouped results alongside the first message input and 
 * the encryption public key to produce a final hash output. 
 */
template MessageHasher() {
    // Message parts
    var MESSAGE_PARTS = 10;
    var STATE_INDEX = 0;
    var VOTE_OPTION_INDEX = 1;
    var NEW_VOTE_WEIGHT = 2;
    var NONCE = 3;
    var POLL_ID = 4;
    var SIGNATURE_POINT_X = 5;
    var SIGNATURE_POINT_Y = 6;
    var SIGNATURE_SCALAR = 7;
    var ENCRYPTED_PUBLIC_KEY_X = 8;
    var ENCRYPTED_PUBLIC_KEY_Y = 9;

    // The MACI message is composed of 10 parts.
    signal input data[MESSAGE_PARTS];
    // the public key used to encrypt the message.
    signal input encryptionPublicKey[2];

    // we output an hash.
    signal output hash;

    var computedHasherPart1 = PoseidonHasher(5)([
        data[STATE_INDEX],
        data[VOTE_OPTION_INDEX],
        data[NEW_VOTE_WEIGHT],
        data[NONCE],
        data[POLL_ID]
    ]);

    var computedHasherPart2 = PoseidonHasher(5)([
        data[SIGNATURE_POINT_X],        
        data[SIGNATURE_POINT_Y],
        data[SIGNATURE_SCALAR],
        data[ENCRYPTED_PUBLIC_KEY_X],
        data[ENCRYPTED_PUBLIC_KEY_Y]
    ]);

    hash <== PoseidonHasher(4)([
        computedHasherPart1,
        computedHasherPart2,
        encryptionPublicKey[0],
        encryptionPublicKey[1]        
    ]);
}
