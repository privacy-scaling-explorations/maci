import type { Signer } from "ethers";

/**
 * Enum for the gatekeeper type
 */
export enum EGatekeeperTrait {
  EAS = "EAS",
  FreeForAll = "FreeForAll",
  GitcoinPassport = "GitcoinPassport",
  Hats = "Hats",
  Semaphore = "Semaphore",
  Token = "Token",
  Zupass = "Zupass",
  MerkleProof = "MerkleProof",
}

/**
 * Interface for the arguments to the getGatekeeperTrait command
 */
export interface IGetGatekeeperTraitArgs {
  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * A signer object
   */
  signer: Signer;
}

/**
 * Interface for the arguments to the get a gatekeeper's data command
 */
export interface IGetGatekeeperDataArgs {
  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * A signer object
   */
  signer: Signer;
}

/**
 * Interface for the semaphore gatekeeper data
 */
export interface ISemaphoreGatekeeperData {
  /**
   * The address of the semaphore gatekeeper
   */
  address: string;

  /**
   * The group ID
   */
  groupId: string;
}

/**
 * Interface for the zupass gatekeeper data
 */
export interface IZupassGatekeeperData {
  /**
   * The event ID
   */
  eventId: string;

  /**
   * The first signer
   */
  signer1: string;

  /**
   * The second signer
   */
  signer2: string;
}

/**
 * Interface for the EAS gatekeeper data
 */
export interface IEASGatekeeperData {
  /**
   * The EAS
   */
  eas: string;

  /**
   * The schema
   */
  schema: string;

  /**
   * The attester
   */
  attester: string;
}

/**
 * Interface for the MerkleProof gatekeeper data
 */
export interface IMerkleProofGatekeeperData {
  /**
   * The merkle tree root
   */
  root: string;
}

/**
 * Interface for the arguments to the mergeSignups command
 */
export interface IMergeSignupsArgs {
  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The number of queue operations to perform
   */
  numQueueOps?: string;
}

/**
 * Interface for the arguments to the genLocalState command
 * Generate a local MACI state from the smart contracts events
 */
export interface IGenerateMaciStateArgs {
  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The private key of the MACI coordinator
   */
  coordinatorPrivateKey: string;

  /**
   * The ethereum provider
   */
  provider?: string;

  /**
   * The path where to write the state
   */
  outputPath?: string;

  /**
   * The start block number
   */
  startBlock?: number;

  /**
   * The end block number
   */
  endBlock?: number;

  /**
   * The number of blocks to fetch per batch
   */
  blockPerBatch?: number;

  /**
   * The transaction hash
   */
  transactionHash?: string;

  /**
   * The sleep time between batches
   */
  sleep?: number;

  /**
   * Backup files for ipfs messages (name format: ipfsHash.json)
   */
  ipfsMessageBackupFiles?: string[];
}
