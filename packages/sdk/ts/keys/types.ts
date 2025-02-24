import type { Signer } from "ethers";
import type { EMode } from "maci-contracts";
import type { IVkContractParams, VerifyingKey } from "maci-domainobjs";

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
 * Interface for the arguments for generate keypair command
 */
export interface IGenerateKeypairArgs {
  /**
   * Seed value for keypair
   */
  seed?: bigint;
}

/**
 * Interface for the return data type for generate keypair command
 */
export interface IGenerateKeypairData {
  /**
   * Serialized public key
   */
  publicKey: string;

  /**
   * Serialized private key
   */
  privateKey: string;
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
