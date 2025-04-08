import {
  type FullProveResult,
  formatProofForVerifierContract,
  verifyProof,
  genProofRapidSnark,
  extractVk,
  genProofSnarkjs,
} from "@maci-protocol/contracts";

import { CircuitInputs } from "./types";

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
  inputs: CircuitInputs,
  zkeyPath: string,
  useWasm: boolean | undefined,
  rapidsnarkExePath: string | undefined,
  witnessExePath: string | undefined,
  wasmPath: string | undefined,
): Promise<string[]> => {
  let r: FullProveResult;

  const vk = await extractVk(zkeyPath);

  if (useWasm === true || useWasm === undefined) {
    r = await genProofSnarkjs({
      inputs,
      zkeyPath,
      wasmPath,
    });
  } else {
    r = await genProofRapidSnark({
      inputs,
      zkeyPath,
      rapidsnarkExePath,
      witnessExePath,
    });
  }

  // verify it
  const isValid = await verifyProof(r.publicSignals, r.proof, vk);

  if (!isValid) {
    throw new Error("Generated an invalid proof");
  }

  return formatProofForVerifierContract(r.proof);
};
