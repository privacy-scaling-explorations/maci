import type { Signer } from "ethers";
import type { MACI, Poll } from "maci-contracts/typechain-types";
import type { PubKey } from "maci-domainobjs";

/**
 * Interface for the arguments to the isJoinedUser command
 */
export interface IJoinedUserArgs {
  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * Poll public key for the poll
   */
  pollPubKey: string;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The start block number
   */
  startBlock: number;
}

/**
 * Interface for the return data to the isRegisteredUser function
 */
export interface IIsRegisteredUser {
  /**
   * Whether the user is registered
   */
  isRegistered: boolean;
  /**
   * The state index of the user
   */
  stateIndex?: string;
}

/**
 * Interface for the return data to the isJoinedUser function
 */
export interface IIsJoinedUser {
  /**
   * Whether the user joined the poll
   */
  isJoined: boolean;
  /**
   * The state index of the user
   */
  pollStateIndex?: string;
  /**
   * The voice credits of the user
   */
  voiceCredits?: string;
}

/**
 * Interface for the arguments to the signup command
 */
export interface ISignupArgs {
  /**
   * The public key of the user
   */
  maciPubKey: string;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The signup gatekeeper data
   */
  sgData: string;
}

/**
 * Interface for the return data to the signup command
 */
export interface ISignupData {
  /**
   * The state index of the user
   */
  stateIndex: string;

  /**
   * The signup transaction hash
   */
  transactionHash: string;
}

/**
 * Interface for the arguments to the register check command
 */
export interface IRegisteredUserArgs {
  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The public key of the user
   */
  maciPubKey: string;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * Start block for event parsing
   */
  startBlock?: number;
}

/**
 * Interface for the arguments to the parsePollJoinEvents function
 */
export interface IParsePollJoinEventsArgs {
  /**
   * The MACI contract
   */
  pollContract: Poll;

  /**
   * The start block
   */
  startBlock: number;

  /**
   * The current block
   */
  currentBlock: number;

  /**
   * The public key
   */
  pollPublicKey: PubKey;
}

/**
 * Interface for the arguments to the parseSignupEvents function
 */
export interface IParseSignupEventsArgs {
  /**
   * The MACI contract
   */
  maciContract: MACI;

  /**
   * The start block
   */
  startBlock: number;

  /**
   * The current block
   */
  currentBlock: number;

  /**
   * The public key
   */
  publicKey: PubKey;
}
