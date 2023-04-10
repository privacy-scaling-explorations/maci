// ElGamal Encryption
include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template ElGamalEncryption() {
// Message m maped on eliptic curve point M(m,y)
signal private input M[2];

// x random from (1,p), where p=21888242871839275222246405745257275088548364400416034343698204186575808495617
signal private input x;

//public key of person B
signal input pubB[2];

// plaintext Me and X
signal output Me[2];
signal output X[2];

// converting x to bits
component xBits = Num2Bits(253);
xBits.in <== x;

// calculate x*G, G-base point
component mulAny = EscalarMulAny(253);
mulAny.p[0] <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
mulAny.p[1] <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;
for (var i=0; i<253; i++) {
mulAny.e[i] <== xBits.out[i];
}
X[0] <== mulAny.out[0];
X[1] <== mulAny.out[1];

// calculate pub_B*x
component pubBx = EscalarMulAny(253);
for (var i = 0; i < 253; i ++) 
{
pubBx.e[i] <== xBits.out[i];
}
pubBx.p[0] <== pubB[0];
pubBx.p[1] <== pubB[1];

//Me=M+pubB*x
component EncryptedMessage = BabyAdd();
EncryptedMessage.x1 <== M[0];
EncryptedMessage.y1 <== M[1];
EncryptedMessage.x2 <== pubBx.out[0];
EncryptedMessage.y2 <== pubBx.out[1];
Me[0] <== EncryptedMessage.xout;
Me[1] <== EncryptedMessage.yout;
}