import type { BaseContract } from "ethers";
import type { Libraries, TaskArguments } from "hardhat/types";

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
