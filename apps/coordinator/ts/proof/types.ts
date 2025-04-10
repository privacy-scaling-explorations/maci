import type { ITallyData, IProof } from "@maci-protocol/sdk";
import type { Hex } from "viem";

import { ESupportedNetworks } from "../common";

/**
 * WS events for proof generation
 */
export enum EProofGenerationEvents {
  START = "start-generation",
  PROGRESS = "progress-generation",
  FINISH = "finish-generation",
  ERROR = "exception",
}

/*
 * Interface that represents read proofs results
 */
export interface IReadProofsResults {
  /**
   * Process proofs list
   */
  process: IProof[];

  /**
   * Tally proofs list
   */
  tally: IProof[];
}

/**
 * Interface that represents generate proofs arguments
 */
export interface IGenerateArgs {
  /**
   * Approval for the session key
   */
  approval?: string;
  /**
   * Session key address
   */
  sessionKeyAddress?: Hex;
  /**
   * Chain
   */
  chain: ESupportedNetworks;

  /**
   * Poll id
   */
  poll: number;

  /**
   * Maci contract address
   */
  maciContractAddress: string;

  /**
   * Whether to use Qv or NonQv
   */
  useQuadraticVoting: boolean;

  /**
   * Encrypted coordinator private key with RSA public key (see .env.example)
   */
  encryptedCoordinatorPrivateKey: string;

  /**
   * Start block for event processing
   */
  startBlock?: number;

  /**
   * End block for event processing
   */
  endBlock?: number;

  /**
   * Blocks per batch for event processing
   */
  blocksPerBatch?: number;
}

/**
 * Interface that represents generated proofs data
 */
export interface IGenerateData {
  /**
   * Message processing proofs
   */
  processProofs: IProof[];

  /**
   * Tally proofs
   */
  tallyProofs: IProof[];

  /**
   * TallyData
   */
  tallyData: ITallyData;
}

/**
 * Interface that represents zkey filepaths
 */
export interface IGetZkeyFilesData {
  /**
   * Zkey filepath
   */
  zkey: string;

  /**
   * Wasm filepath
   */
  wasm: string;
}

/**
 * Merge arguments
 */
export interface IMergeArgs {
  /**
   * MACI contract address
   */
  maciContractAddress: string;
  /**
   * Poll ID
   */
  pollId: number;
  /**
   * Approval for the session key
   */
  approval?: string;
  /**
   * Session key address
   */
  sessionKeyAddress?: Hex;
  /**
   * Chain
   */
  chain: ESupportedNetworks;
}

/**
 * Submit proofs on-chain arguments
 */
export interface ISubmitProofsArgs {
  /**
   * MACI contract address
   */
  maciContractAddress: string;
  /**
   * Poll ID
   */
  pollId: number;
  /**
   * Approval for the session key
   */
  approval?: string;
  /**
   * Session key address
   */
  sessionKeyAddress?: Hex;
  /**
   * Chain
   */
  chain: ESupportedNetworks;
}
