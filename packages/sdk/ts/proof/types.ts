import type { Signer } from "ethers";
import type { Groth16Proof, SnarkProof } from "maci-contracts";
import type { CircuitInputs } from "maci-core";
import type { PublicSignals } from "snarkjs";

import { ITallyData } from "../tally";

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
   * The network name
   */
  networkName: string;

  /**
   * The chain id
   */
  chainId: string;

  /**
   * The maci contract address
   */
  maciContractAddress: string;

  /**
   * The poll id
   */
  pollId: number;

  /**
   * The ipfs message backup files
   */
  ipfsMessageBackupFiles?: string[];

  /**
   * The state file
   */
  stateFile: string;

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
   * The use quadratic voting
   */
  useQuadraticVoting: boolean;

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
  processProofs: IProof[];
  tallyProofs: IProof[];
  tallyData: ITallyData;
}
