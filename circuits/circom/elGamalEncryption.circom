// ElGamal Encryption
include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template ElGamalEncryption() {
    // Curve point M(m,y) mapped from message m 
    signal private input M[2];

    // Random scalar value k from interval (1,p), where p=21888242871839275222246405745257275088548364400416034343698204186575808495617
    signal private input k;

    // Public key
    signal input pk[2];

    // Encrypted message and masking key
    signal output Me[2];
    signal output kG[2];

    // Converting k to bits
    component kBits = Num2Bits(253);
    kBits.in <== k;

    // Calculating masking key k*G, 
    component mulKG = EscalarMulAny(253);

    // Coordinates of the base point G
    mulKG.p[0] <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    mulKG.p[1] <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;

    // Bit representation of the scalar value k
    for (var i = 0; i < 253; i++) {
        mulKG.e[i] <== kBits.out[i];
    }

    kG[0] <== mulKG.out[0];
    kG[1] <== mulKG.out[1];

    // Calculating k * pk
    component mulKPk = EscalarMulAny(253);
    for (var i = 0; i < 253; i ++) {
        mulKPk.e[i] <== kBits.out[i];
    }

    mulKPk.p[0] <== pubB[0];
    mulKPk.p[1] <== pubB[1];

    // Calculating encrypted message point, Me = M + pk * k
    component encryptedMessage = BabyAdd();
    encryptedMessage.x1 <== M[0];
    encryptedMessage.y1 <== M[1];
    encryptedMessage.x2 <== mulKPk.out[0];
    encryptedMessage.y2 <== mulKPk.out[1];

    Me[0] <== EncryptedMessage.xout;
    Me[1] <== EncryptedMessage.yout;
}