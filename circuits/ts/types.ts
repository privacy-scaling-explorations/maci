import type { CircuitInputs } from "maci-core";

/**
 * Parameters for the genProof function
 */
export interface IGenProofOptions {
  inputs: CircuitInputs;
  zkeyPath: string;
  useWasm?: boolean;
  rapidsnarkExePath?: string;
  witnessExePath?: string;
  wasmPath?: string;
  silent?: boolean;
}
