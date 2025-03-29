import type { EMode } from "@maci-protocol/contracts";
import type { IVkContractParams, VerifyingKey } from "@maci-protocol/domainobjs";
import type { Signer } from "ethers";

/**
 * Arguments for the getAllVks function
 */
export interface IGetAllVksArgs {
  /**
   * The address of the VkRegistry contract
   */
  vkRegistryAddress: string;
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
  intStateTreeDepth: number;
  /**
   * The mode to use for the contract calls
   */
  mode: EMode;
}

/**
 * MACI's verifying keys
 */
export interface IMaciVerifyingKeys {
  /**
   * The verifying key for the poll joining circuit
   */
  pollJoiningVkOnChain: IVkContractParams;
  /**
   * The verifying key for the poll joined circuit
   */
  pollJoinedVkOnChain: IVkContractParams;
  /**
   * The verifying key for the process messages circuit
   */
  processVkOnChain: IVkContractParams;
  /**
   * The verifying key for the tally votes circuit
   */
  tallyVkOnChain: IVkContractParams;
}

/**
 * Arguments for the extractAllVks function
 */
export interface IExtractAllVksArgs {
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
  processMessagesZkeyPath?: string;
  /**
   * The path to the tally votes zkey
   */
  tallyVotesZkeyPath?: string;
}

/**
 * Maci verifying keys
 */
export interface IMaciVks {
  /**
   * The poll joining verifying key
   */
  pollJoiningVk?: VerifyingKey;

  /**
   * The poll joined verifying key
   */
  pollJoinedVk?: VerifyingKey;

  /**
   * The message processing verifying key
   */
  processVk?: VerifyingKey;

  /**
   * The tally verifying key
   */
  tallyVk?: VerifyingKey;
}

/**
 * The arguments for the setVerifyingKeys function
 */
export interface ISetVerifyingKeysArgs {
  /**
   * The polll joining Vk object
   */
  pollJoiningVk: VerifyingKey;

  /**
   * The poll joined Vk object
   */
  pollJoinedVk: VerifyingKey;

  /**
   * The process messages Vk object
   */
  processMessagesVk: VerifyingKey;

  /**
   * The tally votes Vk object
   */
  tallyVotesVk: VerifyingKey;

  /**
   * The state tree depth
   */
  stateTreeDepth: number;

  /**
   * The intermediate state tree depth (ballot tree)
   */
  intStateTreeDepth: number;

  /**
   * The vote option tree depth
   */
  voteOptionTreeDepth: number;

  /**
   * The message batch size
   */
  messageBatchSize: number;

  /**
   * The VkRegistry contract address
   */
  vkRegistryAddress: string;

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
  intStateTreeDepth: number;

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
  processMessagesZkeyPath: string;

  /**
   * The path to the tally votes zkey
   */
  tallyVotesZkeyPath: string;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the VkRegistry contract
   */
  vkRegistry: string;

  /**
   * Whether to use quadratic voting or not
   */
  useQuadraticVoting?: boolean;
}

/**
 * Interface for the arguments to the extractVkToFile command
 */
export interface IExtractVkToFileArgs {
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
  processMessagesZkeyPathQv: string;

  /**
   * File path for tallyVotesQv zkey
   */
  tallyVotesZkeyPathQv: string;

  /**
   * File path for processMessagesNonQv zkey
   */
  processMessagesZkeyPathNonQv: string;

  /**
   * File path for tallyVotes zkey
   */
  tallyVotesZkeyPathNonQv: string;

  /**
   * Output file path of extracted vkeys
   */
  outputFilePath: string;
}
