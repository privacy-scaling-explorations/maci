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
 * Interface for the Hats gatekeeper data
 */
export interface IHatsGatekeeperData {
  /**
   * The criterion hat(s)
   */
  criterionHat: string[];

  /**
   * The hats contract
   */
  hatsContract: string;
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
