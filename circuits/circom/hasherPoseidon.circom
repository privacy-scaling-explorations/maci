include "./poseidon/poseidonHashT3.circom"
include "./poseidon/poseidonHashT6.circom"
include "./poseidon/poseidonHashT12.circom"
include "./poseidon/poseidonHashT18.circom"

template Hasher5() {
  var length = 5;
  signal input in[length];
  signal output hash;

  component hasher = PoseidonHashT6();

  for (var i = 0; i < length; i++) {
    hasher.inputs[i] <== in[i];
  }

  hash <== hasher.out;
}

template Hasher11() {
  var length = 11;
  signal input in[length];
  signal output hash;

  component hasher = PoseidonHashT12();

  for (var i = 0; i < length; i++) {
    hasher.inputs[i] <== in[i];
  }

  hash <== hasher.out;
}

template Hasher17(){
  var length = 17;
  signal input in[length];
  signal output hash;

  component hasher = PoseidonHashT18();

  for (var i = 0; i < length; i++) {
    hasher.inputs[i] <== in[i];
  }

  hash <== hasher.out;
}

template HashLeftRight() {
  signal input left;
  signal input right;

  signal output hash;

  component hasher = PoseidonHashT3();
  left ==> hasher.inputs[0];
  right ==> hasher.inputs[1];

  hash <== hasher.out;
}
