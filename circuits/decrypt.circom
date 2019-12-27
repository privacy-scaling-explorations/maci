include "./hasher.circom";
include "../node_modules/circomlib/circuits/escalarmulany.circom";


template Decrypt(N) {
  // Where N is the length of the
  // decrypted message output of the

  signal input message[N+1];
  signal input private_key;
  signal output out[N];

  component hasher[N];

  for(var i=0; i<N; i++) {
    hasher[i] = Hasher(1);
    hasher[i].in[0] <== private_key;
    hasher[i].key <== message[0] + i;
    out[i] <== message[i+1] - hasher[i].hash
  }
}
