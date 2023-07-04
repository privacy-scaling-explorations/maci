pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template PoseidonEncryptIterations(l) {
    var encryptedLength = l;
    while (encryptedLength % 3 != 0) {
        encryptedLength += 1;
    }
    // e.g. if l == 4, decryptedLength == 6

    signal input plaintext[l];

    signal paddedPlaintext[encryptedLength];

    for (var i = 0; i < l; i ++) {
        paddedPlaintext[i] <== plaintext[i];
    }

    for (var i = l; i < encryptedLength; i++) {
        paddedPlaintext[i] <== 0;
    }

    signal input nonce;
    signal input key[2];
    signal output ciphertext[encryptedLength + 1];

    var two128 = 2 ** 128;

    // The nonce must be less than 2 ^ 128
    component lt = LessThan(252);
    lt.in[0] <== nonce;
    lt.in[1] <== two128;
    lt.out === 1;

    var n = (encryptedLength + 1) \ 3;

    component strategies[n + 1];
    // Iterate Poseidon on the initial state
    strategies[0] = PoseidonPerm(4);
    strategies[0].inputs[0] <== 0;
    strategies[0].inputs[1] <== key[0];
    strategies[0].inputs[2] <== key[1];
    strategies[0].inputs[3] <== nonce + (l * two128);

    for (var i = 0; i < n; i ++) {
        // Release three elements of the ciphertext
        for (var j = 0; j < 3; j ++) {
            ciphertext[3 * i + j] <== paddedPlaintext[i * 3 + j] + strategies[i].out[j + 1];
        }

        // Iterate Poseidon on the state
        strategies[i + 1] = PoseidonPerm(4);
        strategies[i + 1].inputs[0] <== strategies[i].out[0];
        for (var j = 0; j < 3; j ++) {
            strategies[i + 1].inputs[j + 1] <== ciphertext[i * 3 + j];
        }
    }
    ciphertext[encryptedLength] <== strategies[n].out[1];
}

template PoseidonEncrypt(l) {
    var encryptedLength = l;
    while (encryptedLength % 3 != 0) {
        encryptedLength += 1;
    }
    // e.g. if l == 4, decryptedLength == 6

    signal input plaintext[l];
    signal input nonce;
    signal input key[2];
    signal output encrypted[encryptedLength + 1];

    component iterations = PoseidonEncryptIterations(l);
    iterations.nonce <== nonce;
    iterations.key[0] <== key[0];
    iterations.key[1] <== key[1];
    for (var i = 0; i < l; i ++) {
        iterations.plaintext[i] <== plaintext[i];
    }

    for (var i = 0; i < encryptedLength + 1; i ++) {
        encrypted[i] <== iterations.ciphertext[i];
    }
}