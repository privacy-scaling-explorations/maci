pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template ElGamalRerandomize() {
    // z random from (1,p), where p=21888242871839275222246405745257275088548364400416034343698204186575808495617
    signal input z;

    // public key of participant B
    signal input pubKey[2];
    
    // existing ciphertext
    signal input c1[2];
    signal input c2[2];

    // rerandomized ciphertext
    signal output c2r[2];
    signal output c1r[2];

    // Convert z to bits
    component zBits = Num2Bits(254);
    zBits.in <== z;

    // calculate z*G
    component mulAny = EscalarMulAny(254);
    mulAny.p[0] <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    mulAny.p[1] <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;
    for (var i=0; i<254; i++) 
    {
    mulAny.e[i] <== zBits.out[i];
    }

    // calculate c1' = z*G + c1
    component c1rAdd = BabyAdd();
    c1rAdd.x1 <== mulAny.out[0];
    c1rAdd.y1 <== mulAny.out[1];
    c1rAdd.x2 <== c1[0];
    c1rAdd.y2 <== c1[1];

    // calculate pubKey * z
    component pubKeyZ = EscalarMulAny(254);
    for (var i = 0; i < 254; i ++) {
    pubKeyZ.e[i] <== zBits.out[i];
    }
    pubKeyZ.p[0] <== pubKey[0];
    pubKeyZ.p[1] <== pubKey[1];

    // calcululate c2' = pubKey * z + c2
    component c2rAdd = BabyAdd();
    c2rAdd.x1 <== pubKeyZ.out[0];
    c2rAdd.y1 <== pubKeyZ.out[1];
    c2rAdd.x2 <== c2[0];
    c2rAdd.y2 <== c2[1];

    // Output is rerandomized ciphertext
    c1r[0] <== c1rAdd.xout;
    c1r[1] <== c1rAdd.yout;
    c2r[0] <== c2rAdd.xout;
    c2r[1] <== c2rAdd.yout;
}