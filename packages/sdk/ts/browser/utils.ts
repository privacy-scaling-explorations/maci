import { groth16, type Groth16Proof } from "snarkjs";

import type { IGenerateProofOptions, FullProveResult, SnarkProof } from "@maci-protocol/contracts";

/**
 * Format a SnarkProof type to an array of strings
 * which can be passed to the Groth16 verifier contract.
 * @param proof the SnarkProof to format
 * @returns an array of strings
 */
export const formatProofForVerifierContract = (proof: SnarkProof | Groth16Proof): string[] =>
  [
    proof.pi_a[0],
    proof.pi_a[1],

    proof.pi_b[0][1],
    proof.pi_b[0][0],
    proof.pi_b[1][1],
    proof.pi_b[1][0],

    proof.pi_c[0],
    proof.pi_c[1],
  ].map((x) => x.toString());

/**
 * Generate a zk-SNARK proof using snarkjs
 * @param inputs - the inputs to the circuit
 * @param zkeyPath - the path to the zkey
 * @param wasmPath - the path to the wasm witness
 * @returns the zk-SNARK proof and public signals
 */
export const generateProofSnarkjs = async ({
  inputs,
  zkeyPath,
  wasmPath,
}: IGenerateProofOptions): Promise<FullProveResult> => {
  if (!wasmPath) {
    throw new Error("wasmPath must be specified");
  }

  const { proof, publicSignals } = await groth16.fullProve(inputs, wasmPath, zkeyPath);
  return { proof, publicSignals };
};
