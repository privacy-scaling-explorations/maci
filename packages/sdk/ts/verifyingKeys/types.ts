import type { EMode } from "@maci-protocol/contracts";
import type { IVerifyingKeyContractParams, VerifyingKey } from "@maci-protocol/domainobjs";
import type { Signer } from "ethers";

/**
 * Arguments for the getAllVerifyingKeys function
 */
export interface IGetAllVerifyingKeysArgs {
  /**
   * The address of the VerifyingKeysRegistry contract
   */
  verifyingKeysRegistryAddress: string;

  /**
   * The signer to use for the contract calls
   */
  signer: Signer;

  /**
   * The depth of the state tree
   */
  stateTreeDepth: number;

  /**
   * The depth of the vote option tree
   */
  voteOptionTreeDepth: number;

  /**
   * The batch size for the process messages
   */
  messageBatchSize: number;

  /**
   * The depth of the ballot tree
   */
  tallyProcessingStateTreeDepth: number;

  /**
   * The mode to use for the contract calls
   */
  mode: EMode;
}

/**
 * MACI's verifying keys
 */
export interface IMaciVerifyingKeysOnchain {
  /**
   * The verifying key for the poll joining circuit
   */
  pollJoiningVerifyingKeyOnChain: IVerifyingKeyContractParams;
  /**
   * The verifying key for the poll joined circuit
   */
  pollJoinedVerifyingKeyOnChain: IVerifyingKeyContractParams;
  /**
   * The verifying key for the process messages circuit
   */
  processVerifyingKeyOnChain: IVerifyingKeyContractParams;
  /**
   * The verifying key for the tally votes circuit
   */
  tallyVerifyingKeyOnChain: IVerifyingKeyContractParams;
}

/**
 * Arguments for the extractAllVerifyingKeys function
 */
export interface IExtractAllVerifyingKeysArgs {
  /**
   * The path to the poll joining zkey
   */
  pollJoiningZkeyPath?: string;

  /**
   * The path to the poll joined zkey
   */
  pollJoinedZkeyPath?: string;

  /**
   * The path to the process messages zkey
   */
  messageProcessorZkeyPath?: string;

  /**
   * The path to the tally votes zkey
   */
  voteTallyZkeyPath?: string;
}

/**
 * Maci verifying keys
 */
export interface IMaciVerifyingKeys {
  /**
   * The poll joining verifying key
   */
  pollJoiningVerifyingKey?: VerifyingKey;

  /**
   * The poll joined verifying key
   */
  pollJoinedVerifyingKey?: VerifyingKey;

  /**
   * The message processing verifying key
   */
  processVerifyingKey?: VerifyingKey;

  /**
   * The tally verifying key
   */
  tallyVerifyingKey?: VerifyingKey;
}

/**
 * The arguments for the setVerifyingKeys function
 */
export interface ISetVerifyingKeysArgs {
  /**
   * The polll joining verifying key object
   */
  pollJoiningVerifyingKey: VerifyingKey;

  /**
   * The poll joined verifying key object
   */
  pollJoinedVerifyingKey: VerifyingKey;

  /**
   * The process messages verifying key object
   */
  processMessagesVerifyingKey: VerifyingKey;

  /**
   * The tally votes verifying key object
   */
  tallyVotesVerifyingKey: VerifyingKey;

  /**
   * The state tree depth
   */
  stateTreeDepth: number;

  /**
   * The poll state tree depth
   */
  pollStateTreeDepth: number;

  /**
   * The intermediate state tree depth (ballot tree)
   */
  tallyProcessingStateTreeDepth: number;

  /**
   * The vote option tree depth
   */
  voteOptionTreeDepth: number;

  /**
   * The message batch size
   */
  messageBatchSize: number;

  /**
   * The VerifyingKeysRegistry contract address
   */
  verifyingKeysRegistryAddress: string;

  /**
   * The signer
   */
  signer: Signer;

  /**
   * QV or NON_QV
   */
  mode: EMode;
}

/**
 * Interface for the arguments to the checkVerifyingKeys command
 */
export interface ICheckVerifyingKeysArgs {
  /**
   * The depth of the state tree
   */
  stateTreeDepth: number;

  /**
   * The depth of the state subtree
   */
  tallyProcessingStateTreeDepth: number;

  /**
   * The depth of the vote option tree
   */
  voteOptionTreeDepth: number;

  /**
   * The size of the message  batch
   */
  messageBatchSize: number;

  /**
   * The path to the poll joining zkey
   */
  pollJoiningZkeyPath: string;

  /**
   * The path to the poll joined zkey
   */
  pollJoinedZkeyPath: string;

  /**
   * The path to the process messages zkey
   */
  messageProcessorZkeyPath: string;

  /**
   * The path to the tally votes zkey
   */
  voteTallyZkeyPath: string;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the VerifyingKeysRegistry contract
   */
  verifyingKeysRegistry: string;

  /**
   * Voting mode
   */
  mode?: EMode;
}

/**
 * Interface for the arguments to the extractVerifyingKeyToFile command
 */
export interface IExtractVerifyingKeyToFileArgs {
  /**
   * File path for poll joining zkey
   */
  pollJoiningZkeyPath: string;

  /**
   * File path for poll joined zkey
   */
  pollJoinedZkeyPath: string;

  /**
   * File path for processMessagesQv zkey
   */
  messageProcessorZkeyPathQv: string;

  /**
   * File path for tallyVotesQv zkey
   */
  voteTallyZkeyPathQv: string;

  /**
   * File path for processMessagesNonQv zkey
   */
  messageProcessorZkeyPathNonQv: string;

  /**
   * File path for MessageProcessor zkey
   */
  messageProcessorZkeyPathFull: string;

  /**
   * File path for VoteTally zkey
   */
  voteTallyZkeyPathNonQv: string;

  /**
   * Output file path of extracted verifying keys
   */
  outputFilePath: string;
}
