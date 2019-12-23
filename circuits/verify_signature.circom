include "../node_modules/circomlib/circuits/eddsamimcsponge.circom";
include "./hasher.circom";

template VerifySignature(k) {
  signal input from_x;
  signal input from_y;
  signal input R8x;
  signal input R8y;
  signal input S;
  signal private input preimage[k];
  
  component M = Hasher(k);
  M.key <== 0;
  for (var i = 0; i < k; i++){
    M.in[i] <== preimage[i];
  }
  
  component verifier = EdDSAMiMCSpongeVerifier();

  verifier.enabled <== 1;
  verifier.Ax <== from_x;
  verifier.Ay <== from_y;
  verifier.S <== S;
  verifier.R8x <== R8x;
  verifier.R8y <== R8y;
  verifier.M <== M.hash;
}
