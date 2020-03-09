include "../node_modules/circomlib/circuits/mimcsponge.circom";

template Hasher(length) {
  signal input in[length];
  signal input key;
  signal output hash;

  component hasher = MiMCSponge(length, 1);
  hasher.k <== key;

  for (var i = 0; i < length; i++) {
    hasher.ins[i] <== in[i];
  }

  hash <== hasher.outs[0];
}

template HashLeftRight() {
  signal input left;
  signal input right;

  signal output hash;

  component hasher = MiMCSponge(2, 1);
  left ==> hasher.ins[0];
  right ==> hasher.ins[1];
  hasher.k <== 0;

  hash <== hasher.outs[0];
}
