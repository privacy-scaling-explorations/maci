include "../node_modules/circomlib/circuits/mimcsponge.circom";

template Hasher(length) {
  signal input in[length];
  signal input key;
  signal output hash;

  component hasher = MiMCSponge(length, 220, 1);
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

  component hasher = Hasher(2);
  hasher.key <== 0;
  hasher.in[0] <== left;
  hasher.in[1] <== right;

  hash <== hasher.hash;
}
