pragma circom 2.0.0;
// ElGamal Encryption
include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

// 0 --> (0, 1); 1 --> BASE point
template BitToPoint() {
    signal input bit;
    signal output M[2];

    component pointSelector = MultiMux1(2);
    pointSelector.s <== bit;

    pointSelector.c[0][0] <== 0;
    pointSelector.c[0][1] <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    pointSelector.c[1][0] <== 1;
    pointSelector.c[1][1] <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;

    M[0] <== pointSelector.out[0];
    M[1] <== pointSelector.out[1];
}

template ElGamalEncryptBit() {
    // Input bit
    signal input m;

    // Random scalar value k from interval (1,p), where p=21888242871839275222246405745257275088548364400416034343698204186575808495617
    signal input k;

    // Public key
    signal input pk[2];

    signal output Me[2];
    signal output kG[2];

    component bitToPoint = BitToPoint();
    bitToPoint.bit <== m;

    component elGamalEncryptPoint = ElGamalEncryptPoint();
    elGamalEncryptPoint.M[0] <== bitToPoint.M[0];
    elGamalEncryptPoint.M[1] <== bitToPoint.M[1];

    elGamalEncryptPoint.k <== k;
    elGamalEncryptPoint.pk[0] <== pk[0];
    elGamalEncryptPoint.pk[1] <== pk[1];

    Me[0] <== elGamalEncryptPoint.Me[0];
    Me[1] <== elGamalEncryptPoint.Me[1];

    kG[0] <== elGamalEncryptPoint.kG[0];
    kG[1] <== elGamalEncryptPoint.kG[1];
}

template ElGamalEncryptPoint() {
    // Curve point M(m,y) mapped from message m 
    signal input M[2];

    // Random scalar value k from interval (1,p), where p=21888242871839275222246405745257275088548364400416034343698204186575808495617
    signal input k;

    // Public key
    signal input pk[2];

    // Encrypted message and masking key
    signal output Me[2];
    signal output kG[2];

    // Converting k to bits
    component kBits = Num2Bits(254);
    kBits.in <== k;

    // Calculating masking key k*G, 
    component mulKG = EscalarMulAny(254);

    // Coordinates of the base point G
    mulKG.p[0] <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    mulKG.p[1] <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;

    // Bit representation of the scalar value k
    for (var i = 0; i < 254; i++) {
        mulKG.e[i] <== kBits.out[i];
    }

    kG[0] <== mulKG.out[0];
    kG[1] <== mulKG.out[1];

    // Calculating k * pk
    component mulKPk = EscalarMulAny(254);
    for (var i = 0; i < 254; i ++) {
        mulKPk.e[i] <== kBits.out[i];
    }

    mulKPk.p[0] <== pk[0];
    mulKPk.p[1] <== pk[1];

    // Calculating encrypted message point, Me = M + pk * k
    component encryptedMessage = BabyAdd();
    encryptedMessage.x1 <== M[0];
    encryptedMessage.y1 <== M[1];
    encryptedMessage.x2 <== mulKPk.out[0];
    encryptedMessage.y2 <== mulKPk.out[1];

    Me[0] <== encryptedMessage.xout;
    Me[1] <== encryptedMessage.yout;
}