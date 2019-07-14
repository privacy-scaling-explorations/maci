include "../../node_modules/circomlib/circuits/mimc.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";


template Decrypt(N) {
  signal input message[N+1];
  signal input privkey;
  signal input pubkey[2];
  signal output out[N];

  component edh = EscalarMulAny(251);
  component privkey_bits = Num2Bits(251);

  privkey_bits.in <== privkey;

  for(var i=0; i<251; i++) {
    edh.e[i] <== privkey_bits.out[i];
  }


  edh.p[0] <== pubkey[0];
  edh.p[1] <== pubkey[1];
  

  component hasher[N];

  for(var i=0; i<N; i++) {
    hasher[i] = MiMC7(91);
    hasher[i].x_in <== edh.out[0];
    hasher[i].k <== message[0] + i;
    out[i] <== message[i+1] - hasher[i].out;
  }
}

