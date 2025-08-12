import {
  type EPolicies,
  type EInitialVoiceCreditProxies,
  type EMode,
  type EInitialVoiceCreditProxiesFactories,
  type ESupportedChains,
  type ECheckers,
} from "@maci-protocol/sdk";
import { type SendUserOperationParameters } from "viem/account-abstraction";

import type { Abi, Hex } from "viem";

/**
 * IDeployMACIArgs represents the arguments for deploying MACI
 */
export interface IDeployMaciArgs {
  /**
   * The address of the session key
   */
  sessionKeyAddress?: Hex;

  /**
   * The approval for the session key
   */
  approval?: string;

  /**
   * The chain name
   */
  chain: ESupportedChains;

  /**
   * The configuration for deploying MACI
   */
  config: IDeployMaciConfig;
}

/**
 * IDeployPollArgs represents the arguments for deploying a poll
 */
export interface IDeployPollArgs {
  /**
   * The address of the session key
   */
  sessionKeyAddress?: Hex;

  /**
   * The approval for the session key
   */
  approval?: string;

  /**
   * The chain name
   */
  chain: ESupportedChains;

  /**
   * The configuration for deploying a poll
   */
  config: IDeployPollConfig;
}

/**
 * IConstantInitialVoiceCreditProxyArgs represents the arguments for deploying a constant initial voice credit proxy
 */
export interface IConstantInitialVoiceCreditProxyArgs {
  /**
   * The amount of initial voice credits to deploy
   */
  amount: number;
}

/**
 * IEASPolicyArgs represents the arguments for deploying an EAS policy
 */
export interface IEASCheckerArgs {
  /**
   * The address of the EAS contract
   */
  easAddress: string;

  /**
   * The attestation schema to be used
   */
  schema: string;

  /**
   * The trusted attester
   */
  attester: string;
}

/**
 * IZupassPolicyArgs represents the arguments for deploying a Zupass policy
 */
export interface IZupassCheckerArgs {
  /**
   * The first signer
   */
  signer1: string;

  /**
   * The second signer
   */
  signer2: string;

  /**
   * The event ID
   */
  eventId: string;

  /**
   * The Zupass verifier address
   */
  zupassVerifier: string;
}

/**
 * IHatsPolicyArgs represents the arguments for deploying a Hats policy
 */
export interface IHatsCheckerArgs {
  /**
   * The hats protocol address
   */
  hatsProtocolAddress: string;

  /**
   * The criterion hats
   */
  critrionHats: string[];
}

/**
 * ISemaphorePolicyArgs represents the arguments for deploying a semaphore policy
 */
export interface ISemaphoreCheckerArgs {
  /**
   * The semaphore contract address
   */
  semaphoreContract: string;

  /**
   * The group ID
   */
  groupId: string;
}

/**
 * IMerkleProofPolicyArgs represents the arguments for deploying a merkle proof policy
 */
export interface IMerkleProofCheckerArgs {
  /**
   * The merkle proof root
   */
  root: string;
}

/**
 * ITokenPolicyArgs represents the arguments for deploying a sign up policy
 */
export interface ITokenCheckerArgs {
  /**
   * The token address
   */
  token: string;
}

/**
 * IAnonAadhaarPolicyArgs represents the arguments for deploying an Anon Aadhaar policy
 */
export interface IAnonAadhaarCheckerArgs {
  /**
   * The Anon Aadhaar verifier address
   */
  verifier: string;

  /**
   * The nullifier seed
   */
  nullifierSeed: string;
}

/**
 * IGitcoinPassportPolicyArgs represents the arguments for deploying a gitcoin passport policy
 */
export interface IGitcoinPassportCheckerArgs {
  /**
   * The decoder address
   */
  decoderAddress: string;

  /**
   * The passing score
   */
  passingScore: string;
}

/**
 * IERC20VotesPolicyArgs represents the arguments for deploying an ERC20 votes policy
 */
export interface IERC20VotesCheckerArgs {
  /**
   * The token address
   */
  token: string;

  /**
   * The threshold
   */
  threshold: bigint | string;

  /**
   * The snapshot block
   */
  snapshotBlock: bigint | string;
}

/**
 * IERC20PolicyArgs represents the arguments for deploying an ERC20 policy
 */
export interface IERC20CheckerArgs {
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
 * IVerifyingKeysRegistryArgs represents the arguments for deploying a VerifyingKeysRegistry
 */
export interface IVerifyingKeysRegistryArgs {
  /**
   * The state tree depth
   */
  stateTreeDepth: bigint | string;

  /**
   * The poll state tree depth
   */
  pollStateTreeDepth: bigint | string;

  /**
   * The int state tree depth determines the tally batch size
   */
  tallyProcessingStateTreeDepth: bigint | string;

  /**
   * The vote option tree depth
   */
  voteOptionTreeDepth: bigint | string;

  /**
   * The message batch size
   */
  messageBatchSize: number;
}

/**
 * TCheckerArgs represents the arguments for deploying a policy
 */
export type TCheckerArgs =
  | IEASCheckerArgs
  | IZupassCheckerArgs
  | IHatsCheckerArgs
  | ISemaphoreCheckerArgs
  | IMerkleProofCheckerArgs
  | ITokenCheckerArgs
  | IAnonAadhaarCheckerArgs
  | IGitcoinPassportCheckerArgs
  | IERC20VotesCheckerArgs
  | IERC20CheckerArgs;

/**
 * IDeployPolicyConfig represents the configuration for deploying a policy
 */
export interface IDeployPolicyConfig {
  /**
   * The policy type (e.g. FreeForAll, ERC20Votes, etc)
   */
  policyType: EPolicies;

  /**
   * The checker type (e.g. FreeForAll, ERC20Votes, etc)
   */
  checkerType: ECheckers;

  /**
   * The checker arguments depending on each policy
   */
  args?: TCheckerArgs;
}

export type IInitialVoiceCreditProxyArgs = IConstantInitialVoiceCreditProxyArgs;
/**
 * DeployMaciConfig is the configuration for deploying MACI
 */
export interface IDeployMaciConfig {
  /**
   * The policy configuration
   */
  policy: IDeployPolicyConfig;

  /**
   * The MACI configuration
   */
  MACI: {
    stateTreeDepth: number;
    policy: EPolicies;
    modes: EMode[];
  };

  /**
   * The VerifyingKeysRegistry configuration
   */
  VerifyingKeysRegistry: {
    args: IVerifyingKeysRegistryArgs;
  };

  /**
   * Poseidon configuration
   */
  Poseidon?: {
    poseidonT3: Hex;
    poseidonT4: Hex;
    poseidonT5: Hex;
    poseidonT6: Hex;
  };
}

/**
 * DeployPollConfig is the configuration for deploying a poll
 */
export interface IDeployPollConfig {
  /**
   * The poll's start date
   */
  startDate: number;

  /**
   * The poll's end date
   */
  endDate: number;

  /**
   * Voting mode
   */
  mode: EMode;

  /**
   * Determines the tally batch size
   */
  tallyProcessingStateTreeDepth: number;

  /**
   * Message batch size
   */
  messageBatchSize: number;

  /**
   * Poll state tree depth
   */
  pollStateTreeDepth: number;

  /**
   * Vote option tree depth
   */
  voteOptionTreeDepth: number;

  /**
   * The policy configuration
   */
  policy: IDeployPolicyConfig;

  /**
   * The initial voice credits proxy configuration
   */
  initialVoiceCreditsProxy: {
    factoryType: EInitialVoiceCreditProxiesFactories;
    type: EInitialVoiceCreditProxies;
    args: IInitialVoiceCreditProxyArgs;
    address?: Hex;
  };

  /**
   * The relayer addresses
   */
  relayers?: string[];

  /**
   * Number of valid vote options
   */
  voteOptions: bigint | string;
}

/**
 * IContractData represents the data for a contract
 */
export interface IContractData {
  /**
   * The contract's address
   */
  address: string | undefined;

  /**
   * The ABI of the contract
   */
  abi: Abi;

  /**
   * The bytecode of the contract
   */
  bytecode: Hex;

  /**
   * Whether the contract is already deployed
   */
  alreadyDeployed: boolean;
}

/**
 * IUserOperation represents the data send for a user operation
 */
export type IUserOperation = SendUserOperationParameters;
