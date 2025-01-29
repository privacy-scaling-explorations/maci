import { EMode } from "maci-contracts";
import { MACI, Poll } from "maci-contracts/typechain-types";
import { PubKey } from "maci-domainobjs";

import type { Provider, Signer } from "ethers";
import type { IVkContractParams, VerifyingKey } from "maci-domainobjs";

/**
 * Interface for the tally file data.
 */
export interface TallyData {
  /**
   * The MACI address.
   */
  maci: string;

  /**
   * The ID of the poll.
   */
  pollId: string;

  /**
   * The name of the network for which these proofs
   * are valid for
   */
  network?: string;

  /**
   * The chain ID for which these proofs are valid for
   */
  chainId?: string;

  /**
   * Whether the poll is using quadratic voting or not.
   */
  isQuadratic: boolean;

  /**
   * The address of the Tally contract.
   */
  tallyAddress: string;

  /**
   * The new tally commitment.
   */
  newTallyCommitment: string;

  /**
   * The results of the poll.
   */
  results: {
    /**
     * The tally of the results.
     */
    tally: string[];

    /**
     * The salt of the results.
     */
    salt: string;

    /**
     * The commitment of the results.
     */
    commitment: string;
  };

  /**
   * The total spent voice credits.
   */
  totalSpentVoiceCredits: {
    /**
     * The spent voice credits.
     */
    spent: string;

    /**
     * The salt of the spent voice credits.
     */
    salt: string;

    /**
     * The commitment of the spent voice credits.
     */
    commitment: string;
  };

  /**
   * The per VO spent voice credits.
   */
  perVOSpentVoiceCredits?: {
    /**
     * The tally of the per VO spent voice credits.
     */
    tally: string[];

    /**
     * The salt of the per VO spent voice credits.
     */
    salt: string;

    /**
     * The commitment of the per VO spent voice credits.
     */
    commitment: string;
  };
}

export type BigNumberish = number | string | bigint;
/**
 * Interface for the arguments to the get poll command
 */
export interface IGetPollArgs {
  /**
   * A signer object
   */
  signer?: Signer;

  /**
   * A provider fallback object
   */
  provider?: Provider;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The poll id. If not specified, latest poll id will be used
   */
  pollId?: BigNumberish;
}

/**
 * Interface for the return data to the get poll command
 */
export interface IGetPollData {
  /**
   * The poll id
   */
  id: BigNumberish;

  /**
   * The poll address
   */
  address: string;

  /**
   * The poll deployment time
   */
  deployTime: BigNumberish;

  /**
   * The poll duration
   */
  duration: BigNumberish;

  /**
   * The poll number of signups
   */
  numSignups: BigNumberish;

  /**
   * Whether the MACI contract's state root has been merged
   */
  isMerged: boolean;

  /**
   * Mode of the poll
   */
  mode: BigNumberish;
}

/**
 * Interface for the arguments to the verifyProof command
 */
export interface VerifyArgs {
  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The tally data
   */
  tallyData: TallyData;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The tally commitments
   */
  tallyCommitments: ITallyCommitments;

  /**
   * The number of vote options
   */
  numVoteOptions: number;

  /**
   * The vote option tree depth
   */
  voteOptionTreeDepth: number;
}

/**
 * Arguments for the get poll params command
 */
export interface IGetPollParamsArgs {
  /**
   * The poll id
   */
  pollId: bigint;
  /**
   * The signer
   */
  signer: Signer;
  /**
   * The MACI contract address
   */
  maciContractAddress: string;
}

/**
 * Poll parameters
 */
export interface IPollParams {
  /**
   * The message batch size
   */
  messageBatchSize: number;
  /**
   * The number of vote options
   */
  numVoteOptions: number;

  /**
   * Tally Batch Size
   */
  tallyBatchSize: number;

  /**
   * The vote option tree depth
   */
  voteOptionTreeDepth: number;

  /**
   * The depth of the tree holding the user ballots
   */
  intStateTreeDepth: number;
}

/**
 * Arguments for the generateTallyCommitments function
 */
export interface IGenerateTallyCommitmentsArgs {
  /**
   * The tally data
   */
  tallyData: TallyData;
  /**
   * The vote option tree depth
   */
  voteOptionTreeDepth: number;
}

/**
 * Interface for the tally commitments
 */
export interface ITallyCommitments {
  /**
   * The new tally commitment
   */
  newTallyCommitment: bigint;
  /**
   * The new spent voice credits commitment
   */
  newSpentVoiceCreditsCommitment: bigint;
  /**
   * The new per vote option spent voice credits commitment
   */
  newPerVOSpentVoiceCreditsCommitment?: bigint;
  /**
   * The commitment to the results tree root
   */
  newResultsCommitment: bigint;
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
 * Arguments for the getAllVks function
 */
export interface GetAllVksArgs {
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
 * Circuit parameters
 */
export interface ICircuitParams {
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
