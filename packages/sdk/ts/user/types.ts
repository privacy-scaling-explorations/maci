import { type LeanIMTMerkleProof } from "@zk-kit/lean-imt";

import type { MACI, Poll } from "@maci-protocol/contracts/typechain-types";
import type { PrivateKey, PublicKey } from "@maci-protocol/domainobjs";
import type { Signer } from "ethers";

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
  pollPublicKey: string;

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
  maciPublicKey: string;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The signup policy data
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
  maciPublicKey: string;

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
  pollPublicKey: PublicKey;
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
  publicKey: PublicKey;
}

/**
 * An interface describing the circuit inputs to the PollJoining circuit
 */
export interface IPollJoiningCircuitInputs {
  /**
   * The private key
   */
  privateKey: string;

  /**
   * The poll public key
   */
  pollPublicKey: string[];

  /**
   * The state leaf
   */
  stateLeaf: string[];

  /**
   * The siblings for the merkle proof
   */
  siblings: string[][];

  /**
   * The path indices
   */
  indices: string[];

  /**
   * The nullifier
   */
  nullifier: string;

  /**
   * The state root
   */
  stateRoot: string;

  /**
   * The actual state tree depth
   */
  actualStateTreeDepth: string;

  /**
   * The poll id
   */
  pollId: string;
}

/**
 * An interface describing the circuit inputs to the PollJoined circuit
 */
export interface IPollJoinedCircuitInputs {
  /**
   * The private key
   */
  privateKey: string;

  /**
   * The voice credits balance
   */
  voiceCreditsBalance: string;

  /**
   * The state leaf
   */
  stateLeaf: string[];

  /**
   * The path elements
   */
  pathElements: string[][];

  /**
   * The path indices
   */
  pathIndices: string[];

  /**
   * The state root
   */
  stateRoot: string;

  /**
   * The actual state tree depth
   */
  actualStateTreeDepth: string;
}

/**
 * Interface for the arguments to the joinPoll command
 */
export interface IJoinPollArgs {
  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The private key of the user
   */
  privateKey: string;

  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * Path to the state file with MACI state. Not available in the browser's SDK
   */
  stateFile?: string;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The end block number
   */
  endBlock?: number;

  /**
   * The start block number
   */
  startBlock?: number;

  /**
   * The number of blocks to fetch per batch
   */
  blocksPerBatch?: number;

  /**
   * The path to the poll zkey file
   */
  pollJoiningZkey: string;

  /**
   * Whether to use wasm or rapidsnark
   */
  useWasm?: boolean;

  /**
   * The path to the rapidsnark binary
   */
  rapidsnark?: string;

  /**
   * The path to the poll witness generator binary
   */
  pollWitnessGenerator?: string;

  /**
   * The path to the poll joining wasm file
   */
  pollJoiningWasm?: string;

  /**
   * The signup policy data
   */
  sgDataArg: string;

  /**
   * The initial voice credit proxy data
   */
  ivcpDataArg: string;
}

/**
 * Interface for the arguments to the joinPoll command for the browser
 */
export interface IJoinPollBrowserArgs extends IJoinPollArgs {
  /**
   * Whether to use of not the latest state index
   */
  useLatestStateIndex?: boolean;

  /**
   * The inclusion proof
   */
  inclusionProof?: LeanIMTMerkleProof;
}

/**
 * Interface for the return data to the joinPoll command
 */
export interface IJoinPollData {
  /**
   * The poll state index of the joined user
   */
  pollStateIndex: string;

  /**
   * Voice credits balance
   */
  voiceCredits: string;

  /**
   * Private key nullifier
   */
  nullifier: string;

  /**
   * The join poll transaction hash
   */
  hash: string;
}

/**
 * The arguments to check if a nullifier is on chain
 */
export interface IIsNullifierOnChainArgs {
  /**
   * The address of the MACI contract
   */
  maciAddress: string;
  /**
   * The id of the poll
   */
  pollId: bigint;
  /**
   * The nullifier to check
   */
  nullifier: bigint;
  /**
   * The signer to use
   */
  signer: Signer;
}

/**
 * Arguments for IGenerateMaciStateTreeArgs
 */
export interface IGenerateMaciStateTreeArgs {
  /**
   * The MACI contract address
   */
  maciContractAddress: string;

  /**
   * The signer
   */
  signer: Signer;

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
}

/**
 * Arguments for IGenerateMaciStateTreeWithEndKeyArgs
 */
export interface IGenerateMaciStateTreeWithEndKeyArgs extends IGenerateMaciStateTreeArgs {
  /**
   * The public key of the user
   */
  userPublicKey: PublicKey;
}

/**
 * Arguments for getPollJoiningCircuitEvents
 */
export interface IGetPollJoiningCircuitEventsArgs {
  /**
   * The MACI contract
   */
  maciContract: MACI;

  /**
   * The state index
   */
  stateIndex: bigint;

  /**
   * The poll id
   */
  pollId: bigint;

  /**
   * The user's maci private key
   */
  userMaciPrivateKey: PrivateKey;

  /**
   * The signer
   */
  signer: Signer;

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
}

/**
 * Arguments for getPollJoiningCircuitInputsFromStateFile
 */
export interface IGetPollJoiningCircuitInputsFromStateFileArgs {
  /**
   * The path to the file containing the serialized MACI state
   */
  stateFile: string;

  /**
   * The poll id
   */
  pollId: bigint;

  /**
   * The state index
   */
  stateIndex: bigint;

  /**
   * The user's maci private key
   */
  userMaciPrivateKey: PrivateKey;
}

/**
 * Interface for the arguments for the is signed up command
 */
export interface IHasUserSignedUpArgs {
  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The public key of the user
   */
  maciPublicKey: string;

  /**
   * The signer to use for the transaction
   */
  signer: Signer;
}
