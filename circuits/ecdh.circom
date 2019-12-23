include "./hasher.circom";
include "../node_modules/circomlib/circuits/binsum.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template Bits2Num_stricter() {
    signal input in[254];
    signal output out;

    component aliasCheck = AliasCheck();
    component b2n = Bits2Num(254);

    for (var i=0; i<254; i++) {
        in[i] ==> b2n.in[i];
        in[i] ==> aliasCheck.in[i];
    }

    b2n.out ==> out;
}

template Ecdh() {
  signal private input private_key;
  signal input public_key[2];

  signal output shared_key;

  component hasher = Hasher(1);
  hasher.key <== 0;
  hasher.in[0] <== private_key;

  // Get first 32 numbers 
  var b = hasher.hash;
  while (b >= 10**32) {
    b = b \ 10;
  }

  var bits_no = nbits(b);

  // Prune the buffer
  component b_bits = Num2Bits(bits_no);
  b_bits.in <== b;

  component pruned_bits = Bits2Num(bits_no);

  // Perform AND with 0xF8 on the first 8 bits
  component xF8_bits = Num2Bits(8);
  xF8_bits.in <== 0xF8;

  for (var i = 0; i < bits_no; i++) {
    if (i >= 0 && i < 8) {
      pruned_bits.in[i] <== b_bits.out[i] & xF8_bits.out[i - (254 - bits_no)]
    } else {
      pruned_bits.in[i] <== b_bits.out[i];
    }
  }

  shared_key <== pruned_bits.out;
}
