include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template ElGamalReRandomize() {
    // z random from (1,p), where p=21888242871839275222246405745257275088548364400416034343698204186575808495617
    signal private input z;

    // public key of person B
    signal input pubB[2];
    
    // existing ciphertext
    signal input X[2];
    signal input Me[2];

    // rerandomized ciphertext
    signal output Me1[2];
    signal output X1[2];

    // Convert z to bits
    component zBits = Num2Bits(253);
    zBits.in <== z;

    // calculate z*G
    component mulAny = EscalarMulAny(253);
    mulAny.p[0] <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    mulAny.p[1] <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;
    for (var i=0; i<253; i++) 
    {
    mulAny.e[i] <== zBits.out[i];
    }

    // calculate X1 = z*G + X
    component X1Add = BabyAdd();
    X1Add.x1 <== mulAny.out[0];
    X1Add.y1 <== mulAny.out[1];
    X1Add.x2 <== X[0];
    X1Add.y2 <== X[1];

    // calculate pubB * z
    component pubKeyZ = EscalarMulAny(253);
    for (var i = 0; i < 253; i ++) {
    pubKeyZ.e[i] <== zBits.out[i];
    }
    pubKeyZ.p[0] <== pubB[0];
    pubKeyZ.p[1] <== pubB[1];

    // calcululate Me1 = pubB * z + Me
    component Me1Add = BabyAdd();
    Me1Add.x1 <== pubKeyZ.out[0];
    Me1Add.y1 <== pubKeyZ.out[1];
    Me1Add.x2 <== Me[0];
    Me1Add.y2 <== Me[1];

    // Output is rerandomized ciphertext
    X1[0] <== X1Add.xout;
    X1[1] <== X1Add.yout;
    Me1[0] <== Me1Add.xout;
    Me1[1] <== Me1Add.yout;
}