import type { Signer } from "ethers";

/**
 * Arguments for the genProofs function
 */
export interface IGenProofsArgs {
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
