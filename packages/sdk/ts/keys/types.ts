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
