import {
  type FullProveResult,
  verifyProof,
  generateProofRapidSnark,
  extractVerifyingKey,
  generateProofSnarkjs,
  formatProofForVerifierContract,
} from "@maci-protocol/contracts";

import type { TCircuitInputs } from "./types";

/**
 * Generate and verify poll proof
 * @param inputs - the inputs to the circuit
 * @param zkeyPath - the path to the zkey
 * @param useWasm - whether we want to use the wasm witness or not
 * @param rapidsnarkExePath - the path to the rapidnsark binary
 * @param witnessExePath - the path to the compiled witness binary
 * @param wasmPath - the path to the wasm witness
 * @returns proof - an array of strings
 */
export const generateAndVerifyProof = async (
  inputs: TCircuitInputs,
  zkeyPath: string,
  useWasm: boolean | undefined,
  rapidsnarkExePath: string | undefined,
  witnessExePath: string | undefined,
  wasmPath: string | undefined,
): Promise<string[]> => {
  let r: FullProveResult;

  const verifyingKey = await extractVerifyingKey(zkeyPath);

  if (useWasm === true || useWasm === undefined) {
    r = await generateProofSnarkjs({
      inputs,
      zkeyPath,
      wasmPath,
    });
  } else {
    r = await generateProofRapidSnark({
      inputs,
      zkeyPath,
      rapidsnarkExePath,
      witnessExePath,
    });
  }

  // verify it
  const isValid = await verifyProof(r.publicSignals, r.proof, verifyingKey);

  if (!isValid) {
    throw new Error("Generated an invalid proof");
  }

  return formatProofForVerifierContract(r.proof);
};
