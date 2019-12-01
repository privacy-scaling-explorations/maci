include "../node_modules/circomlib/circuits/mimc.circom";

template Hasher(length) {
  signal input in[length];
  signal output hash;

  component hasher = MultiMiMC7(length, 91);
  hasher.k <== 0;

  for (var i = 0; i < length; i++) {
    hasher.in[i] <== in[i];
  }

  hash <== hasher.out;
}

template HashLeftRight() {
  signal input left;
  signal input right;

  signal output hash;

  component hasher = Hasher(2);
  hasher.in[0] <== left;
  hasher.in[1] <== right;

  hash <== hasher.hash;
}
