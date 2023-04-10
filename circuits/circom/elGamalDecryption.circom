// ElGamal Decryption
include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template ElGamalDecrypt() {
    signal input X[2];
    signal input Me[2];
    signal private input prB;
    signal output m;

    // Private key of person B converting to bits
    component prBBits = Num2Bits(253);
    prBBits.in <== prB;
    
    // calculate pub_B*x
    component pubBx = EscalarMulAny(253);
    for (var i = 0; i < 253; i ++) 
    {
        pubBx.e[i] <== prBBits.out[i];
    }
    pubBx.p[0] <== X[0];
    pubBx.p[1] <== X[1];

    // calculate inverse x of pubBx 
    signal inverse;
    inverse <== 0 - pubBx.out[0];

    // decrypts message
    component decrypteMessage = BabyAdd();
    decryptedMessage.x1 <== inverse;
    decryptedMessage.y1 <== pubBx.out[1];
    decryptedMessage.x2 <== Me[0];
    decryptedMessage.y2 <== Me[1];

    m <== decryptedMessage.xout;
}