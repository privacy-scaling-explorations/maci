include "./Decrypt.circom"

template Decrypt_test(N) {
  signal input message[N+1];
  signal input privkey;
  signal input pubkey[2];
  signal input decmessage[N];

  component decrypt = Decrypt(N);
  for(var i=0; i<N+1; i++) 
    decrypt.message[i] <== message[i];

  for(var i=0; i<N; i++) 
    decrypt.out[i] === decmessage[i];

  for(var i=0; i<2; i++) 
    decrypt.pubkey[i] <== pubkey[i];
  
  decrypt.privkey <== privkey;

}

component main = Decrypt_test(4);