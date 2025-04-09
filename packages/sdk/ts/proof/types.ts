import type { ITallyData } from "../tally/types";
import type { Groth16Proof, SnarkProof } from "@maci-protocol/contracts";
import type { CircuitInputs } from "@maci-protocol/core";
import type { BigNumberish, Signer } from "ethers";
import type { PublicSignals } from "snarkjs";

/**
 * Interface for the arguments to the proveOnChain command
 */
export interface IProveOnChainArgs {
  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * The directory containing the proofs
   */
  proofDir: string;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The tally file with results, per vote option spent credits, spent voice credits total
   */
  tallyFile?: string;
}

/**
 * Proof interface for sdk commands
 */
export interface IProof {
  /**
   * Proof
   */
  proof: SnarkProof | Groth16Proof;

  /**
   * Circuit inputs
   */
  circuitInputs: CircuitInputs;

  /**
   * Public signals
   */
  publicInputs: PublicSignals;
}

/**
 * Arguments for the genProofs function
 */
export interface IGenerateProofsArgs {
  /**
   * The output directory
   */
  outputDir: string;

  /**
   * The coordinator private key
   */
  coordinatorPrivateKey: string;

  /**
   * The signer
   */
  signer: Signer;

  /**
   * The maci contract address
   */
  maciAddress: string;

  /**
   * The poll id
   */
  pollId: BigNumberish;

  /**
   * The ipfs message backup files
   */
  ipfsMessageBackupFiles?: string[];

  /**
   * The state file
   */
  stateFile?: string;

  /**
   * The transaction hash
   */
  transactionHash?: string;

  /**
   * The start block
   */
  startBlock?: number;

  /**
   * The end block
   */
  endBlock?: number;

  /**
   * The blocks per batch
   */
  blocksPerBatch?: number;

  /**
   * The rapidsnark path
   */
  rapidsnark?: string;

  /**
   * The path to the process dat file
   */
  processDatFile?: string;

  /**
   * The path to the tally dat file
   */
  tallyDatFile?: string;

  /**
   * The use quadratic voting
   */
  useQuadraticVoting: boolean;

  /**
   * Whether to use wasm or rapidsnark
   */
  useWasm?: boolean;

  /**
   * The tally zkey
   */
  tallyZkey: string;

  /**
   * The tally witgen
   */
  tallyWitgen?: string;

  /**
   * The tally wasm
   */
  tallyWasm?: string;

  /**
   * The process zkey
   */
  processZkey: string;

  /**
   * The process witgen
   */
  processWitgen?: string;

  /**
   * The process wasm
   */
  processWasm?: string;

  /**
   * The tally file
   */
  tallyFile: string;
}

/**
 * Interface for the data returned by the generateProofs function
 */
export interface IGenerateProofsData {
  /**
   * Process proofs
   */
  processProofs: IProof[];

  /**
   * Tally proofs
   */
  tallyProofs: IProof[];

  /**
   * Tally data
   */
  tallyData: ITallyData;
}

/**
 * Interface for the poll joining artifacts
 */
export interface IPollJoiningArtifacts {
  /**
   * The zkey
   */
  zKey: Uint8Array;

  /**
   * The wasm
   */
  wasm: Uint8Array;
}
