import type { Signer } from "ethers";

/**
 * Enum for the policy type
 */
export enum EPolicyTrait {
  EAS = "EAS",
  FreeForAll = "FreeForAll",
  GitcoinPassport = "GitcoinPassport",
  Hats = "Hats",
  Semaphore = "Semaphore",
  Token = "Token",
  Zupass = "Zupass",
  MerkleProof = "MerkleProof",
  ERC20 = "ERC20",
  ERC20Votes = "ERC20Votes",
}

/**
 * Interface for the arguments to the getPolicyTrait command
 */
export interface IGetPolicyTraitArgs {
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
 * Interface for the arguments to the get a policy data command
 */
export interface IGetPolicyDataArgs {
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
 * Interface for the semaphore policy data
 */
export interface ISemaphorePolicyData {
  /**
   * The address of the semaphore policy
   */
  address: string;

  /**
   * The group ID
   */
  groupId: string;
}

/**
 * Interface for the zupass policy data
 */
export interface IZupassPolicyData {
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
 * Interface for the EAS policy data
 */
export interface IEASPolicyData {
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
 * Interface for the MerkleProof policy data
 */
export interface IMerkleProofPolicyData {
  /**
   * The merkle tree root
   */
  root: string;
}

/**
 * Interface for the erc20 policy data
 */
export interface IERC20PolicyData {
  /**
   * The token address
   */
  token: string;

  /**
   * The threshold
   */
  threshold: string;
}

/**
 * Interface for the erc20 votes policy data
 */
export interface IERC20VotesPolicyData {
  /**
   * The token address
   */
  token: string;

  /**
   * The threshold
   */
  threshold: string;

  /**
   * The snapshot block
   */
  snapshotBlock: string;
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
 * Interface for the arguments to the generateLocalState command
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

  /**
   * The file path where to save the logs for debugging and auditing purposes
   */
  logsOutputPath?: string;
}
