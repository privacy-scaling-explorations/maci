import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import type { IVerifyingKeyStruct } from "../../ts/types";
import type { BaseContract, BaseContractMethod, BigNumberish, TransactionResponse } from "ethers";
import type { Libraries, TaskArguments } from "hardhat/types";
import type { IG1ContractParams } from "maci-domainobjs";

/**
 * Interface that represents deploy params
 */
export interface IDeployParams {
  /**
   * Param for verification toggle
   */
  verify: boolean;

  /**
   * Param for incremental deploy toggle
   */
  incremental: boolean;

  /**
   * Consider warning as errors
   */
  strict?: boolean;

  /**
   * Skip steps with less or equal index
   */
  skip?: number;
}

/**
 * Interface that represents merge params
 */
export interface IMergeParams {
  /**
   * The poll id
   */
  poll: BigNumberish;

  /**
   * The number of queue operations to perform
   */
  queueOps?: number;

  /**
   * Run prove command after merging
   */
  prove?: boolean;
}

/**
 * Interface that represents deploy step catalog
 */
export interface IDeployStepCatalog {
  /**
   * Step name
   */
  name: string;

  /**
   * Deploy task name
   */
  taskName: string;

  /**
   * Params function with deploy arguments
   *
   * @param params deploy params
   * @returns task arguments
   */
  paramsFn: (params: IDeployParams) => Promise<TaskArguments>;
}

/**
 * Interface that represents deploy step
 */
export interface IDeployStep {
  /**
   * Sequence step id
   */
  id: number;

  /**
   * Step name
   */
  name: string;

  /**
   * Deploy task name
   */
  taskName: string;

  /**
   * Deployment arguments
   */
  args: TaskArguments;
}

/**
 * Interface that represents contract storage named entry
 */
export interface IStorageNamedEntry {
  /**
   * Contract address
   */
  address: string;

  /**
   * Count of deployed instances
   */
  count: number;
}

/**
 * Interface that represents contract storage instance entry
 */
export interface IStorageInstanceEntry {
  /**
   * Entry identificator
   */
  id: string;

  /**
   * Params for verification
   */
  verify?: {
    args?: string;
    impl?: string;
    subType?: string;
  };
}

/**
 * Interface that represents register contract arguments
 */
export interface IRegisterContract {
  /**
   * Contract enum identifier
   */
  id: EContracts;

  /**
   * Contract instance
   */
  contract: BaseContract;

  /**
   * Deploy network name
   */
  network: string;

  /**
   * Contract deployment arguments
   */
  args?: unknown[];

  /**
   * Group key for same contracts
   */
  key?: BigNumberish;
}

/**
 * Enum represents deployed contracts
 */
export enum EContracts {
  ConstantInitialVoiceCreditProxy = "ConstantInitialVoiceCreditProxy",
  FreeForAllGatekeeper = "FreeForAllGatekeeper",
  EASGatekeeper = "EASGatekeeper",
  Verifier = "Verifier",
  TopupCredit = "TopupCredit",
  MACI = "MACI",
  StateAq = "StateAq",
  PollFactory = "PollFactory",
  MessageProcessorFactory = "MessageProcessorFactory",
  TallyFactory = "TallyFactory",
  SubsidyFactory = "SubsidyFactory",
  PoseidonT3 = "PoseidonT3",
  PoseidonT4 = "PoseidonT4",
  PoseidonT5 = "PoseidonT5",
  PoseidonT6 = "PoseidonT6",
  VkRegistry = "VkRegistry",
  Poll = "Poll",
}

/**
 * Interface that represents verify arguments
 */
export interface IVerifyFullArgs {
  /**
   * Ignore verified status
   */
  force?: boolean;
}

/**
 * Interface that represents verification subtaks arguments
 * This is extracted from hardhat etherscan plugin
 */
export interface IVerificationSubtaskArgs {
  /**
   * Contract address
   */
  address: string;

  /**
   * Constructor arguments
   */
  constructorArguments: unknown[];

  /**
   * Fully qualified name of the contract
   */
  contract?: string;

  /**
   * Libraries
   */
  libraries?: Libraries;
}

export interface ITreeMergeParams {
  /**
   * Ethers signer
   */
  deployer: HardhatEthersSigner;

  /**
   * AccQueue contract
   */
  signupAccQueueContract: StateAq;

  /**
   * Poll contract
   */
  pollContract: Poll;

  /**
   * MACI contract
   */
  maciContract: MACI;

  /**
   * Message AccQueue contract
   */
  messageAccQueueContract: StateAq;
}

// Add types manually because typechain is not available during compilation

/**
 * Poll deploy params
 */
export type TDeployPollParams = [
  BigNumberish,
  {
    intStateTreeDepth: BigNumberish;
    messageTreeSubDepth: BigNumberish;
    messageTreeDepth: BigNumberish;
    voteOptionTreeDepth: BigNumberish;
  },
  IG1ContractParams,
  string,
  string,
  boolean,
];

/**
 * MACI contract wrapper
 */
export interface MACI extends BaseContract {
  /**
   * Get next poll id
   *
   * @returns next poll id
   */
  nextPollId: () => Promise<bigint>;

  /**
   * Get AccQueue contract address
   *
   * @returns address
   */
  stateAq: () => Promise<string>;

  /**
   * Get state tree depth
   *
   * @returns state tree depth
   */
  stateTreeDepth: () => Promise<bigint>;

  /**
   * Get the poll contract address with poll id
   *
   * @param pollId - poll id
   * @returns poll contract address
   */
  polls: (pollId: BigNumberish) => Promise<string>;

  /**
   * Deploy a new Poll contract.
   */
  deployPoll: BaseContractMethod<TDeployPollParams, TransactionResponse & [string]>;
}

/**
 * StateAq contract wrapper
 */
export interface StateAq extends BaseContract {
  /**
   * Check if tree is merged
   *
   * @returns tree merged or not
   */
  treeMerged: () => Promise<boolean>;

  /**
   * Check if subtrees are merged
   *
   * @returns subtrees merged or not
   */
  subTreesMerged: () => Promise<boolean>;

  /**
   * Get the next subroot index and the current subtree index.
   *
   * @returns indices
   */
  getSrIndices: () => Promise<[bigint, bigint]>;

  /**
   * Get the merged Merkle root of all the leaves at a desired depth.
   *
   * @returns root
   */
  getMainRoot: (depth: BigNumberish) => Promise<bigint>;
}

/**
 * VkRegistry contract wrapper
 */
export interface VkRegistry extends BaseContract {
  /**
   * Set verifying keys
   */
  setVerifyingKeys: BaseContractMethod<
    [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, IVerifyingKeyStruct, IVerifyingKeyStruct],
    TransactionResponse
  >;

  /**
   * Set subsidy keys
   */
  setSubsidyKeys: BaseContractMethod<
    [BigNumberish, BigNumberish, BigNumberish, IVerifyingKeyStruct],
    TransactionResponse
  >;
}

/**
 * Poll contract wrapper
 */
export interface Poll extends BaseContract {
  /**
   * Get the maximum number of messages and vote options
   *
   * @returns number of messages and vote options
   */
  maxValues: () => Promise<[BigNumberish, BigNumberish]>;

  /**
   * Get the external contracts for poll
   *
   * @returns external contracts addresses
   */
  extContracts: () => Promise<[string, string, string]>;

  /**
   * Get deploy time and duration of the poll
   *
   * @returns deploy time and duration
   */
  getDeployTimeAndDuration: () => Promise<[BigNumberish, BigNumberish]>;

  /**
   * Get the poll owner
   *
   * @returns poll owner
   */
  owner: () => Promise<string>;

  /**
   * Get the depths of the merkle trees
   *
   * @returns depths
   */
  treeDepths: () => Promise<[BigNumberish, BigNumberish, BigNumberish, BigNumberish]>;

  /**
   * The first step of merging the MACI state AccQueue.
   */
  mergeMaciStateAqSubRoots: BaseContractMethod<[number, BigNumberish], TransactionResponse>;

  /**
   * The second step of merging the MACI state AccQueue
   */
  mergeMaciStateAq: BaseContractMethod<[BigNumberish], TransactionResponse>;

  /**
   * The first step in merging the message AccQueue
   */
  mergeMessageAqSubRoots: BaseContractMethod<[BigNumberish], TransactionResponse>;

  /**
   * The second step in merging the message AccQueue
   */
  mergeMessageAq: BaseContractMethod<[], TransactionResponse>;
}
