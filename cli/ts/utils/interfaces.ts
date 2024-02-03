import { Signer } from "ethers";

import type { SnarkProof } from "maci-contracts";
import type { CircuitInputs } from "maci-core";
import type { Groth16Proof, PublicSignals } from "snarkjs";

export interface DeployedContracts {
  maciAddress: string;
  stateAqAddress: string;
  pollFactoryAddress: string;
  topupCreditAddress: string;
  poseidonT3Address: string;
  poseidonT4Address: string;
  poseidonT5Address: string;
  poseidonT6Address: string;
  initialVoiceCreditProxyAddress: string;
  signUpGatekeeperAddress: string;
  verifierAddress: string;
}

export interface PollContracts {
  poll: string;
  messageProcessor: string;
  tally: string;
  subsidy?: string;
}

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
  perVOSpentVoiceCredits: {
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

/**
 * A util interface that represents a subsidy file
 */
export interface SubsidyData {
  provider: string;
  maci: string;
  pollId: bigint;
  newSubsidyCommitment: string;
  results: {
    subsidy: string[];
    salt: string;
  };
}

/**
 * Proof interface for cli commands
 */
export interface Proof {
  proof: SnarkProof | Groth16Proof;
  circuitInputs: CircuitInputs;
  publicInputs: PublicSignals;
}

// snark js related interfaces
export type BigNumberish = number | string | bigint;

export interface ISnarkJSVerificationKey {
  protocol: BigNumberish;
  curve: BigNumberish;
  nPublic: BigNumberish;
  vk_alpha_1: BigNumberish[];
  vk_beta_2: BigNumberish[][];
  vk_gamma_2: BigNumberish[][];
  vk_delta_2: BigNumberish[][];
  vk_alphabeta_12: BigNumberish[][][];
  IC: BigNumberish[][];
}

/**
 * Interface for the arguments to the airdrop command
 */
export interface AirdropArgs {
  /**
   * The amount of credits to airdrop
   */
  amount: number;

  /**
   * The address of the ERC20 contract
   */
  contractAddress?: string;

  /**
   * The id of the poll
   */
  pollId?: bigint;

  /**
   * The address of the MACI contract
   */
  maciAddress?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the checkVerifyingKeys command
 */
export interface CheckVerifyingKeysArgs {
  /**
   * The depth of the state tree
   */
  stateTreeDepth: number;

  /**
   * The depth of the state subtree
   */
  intStateTreeDepth: number;

  /**
   * The depth of the message tree
   */
  messageTreeDepth: number;

  /**
   * The depth of the vote option tree
   */
  voteOptionTreeDepth: number;

  /**
   * The depth of the message batch tree
   */
  messageBatchDepth: number;

  /**
   * The path to the process messages zkey
   */
  processMessagesZkeyPath: string;

  /**
   * The path to the tally votes zkey
   */
  tallyVotesZkeyPath: string;

  /**
   * The address of the VkRegistry contract
   */
  vkRegistry?: string;

  /**
   * The path to the subsidy zkey
   */
  subsidyZkeyPath?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the deploy command
 */
export interface DeployArgs {
  /**
   * The depth of the state tree
   */
  stateTreeDepth: number;

  /**
   * The initial voice credits to be minted
   */
  initialVoiceCredits?: number;

  /**
   * The address of the initialVoiceCreditsProxy contract
   */
  initialVoiceCreditsProxyAddress?: string;

  /**
   * The address of the signupGatekeeper contract
   */
  signupGatekeeperAddress?: string;

  /**
   * The address of the PoseidonT3 contract
   */
  poseidonT3Address?: string;

  /**
   * The address of the PoseidonT4 contract
   */
  poseidonT4Address?: string;

  /**
   * The address of the PoseidonT5 contract
   */
  poseidonT5Address?: string;

  /**
   * The address of the PoseidonT6 contract
   */
  poseidonT6Address?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the deployPoll command
 */
export interface DeployPollArgs {
  /**
   * The duration of the poll in seconds
   */
  pollDuration: number;

  /**
   * The depth of the intermediate state tree
   */
  intStateTreeDepth: number;

  /**
   * The depth of the message tree sublevels
   */
  messageTreeSubDepth: number;

  /**
   * The depth of the message tree
   */
  messageTreeDepth: number;

  /**
   * The depth of the vote option tree
   */
  voteOptionTreeDepth: number;

  /**
   * The coordinator's public key
   */
  coordinatorPubkey: string;

  /**
   * Whether to deploy subsidy contract
   */
  subsidyEnabled: boolean;

  /**
   * The MACI contract address
   */
  maciAddress?: string;

  /**
   * The vkRegistry contract address
   */
  vkRegistryAddress?: string;

  /**
   * Whether to log the output to the console
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the genLocalState command
 * Generate a local MACI state from the smart contracts events
 */
export interface GenLocalStateArgs {
  /**
   * The path where to write the state
   */
  outputPath: string;

  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * The address of the MACI contract
   */
  maciContractAddress?: string;

  /**
   * The private key of the MACI coordinator
   */
  coordinatorPrivateKey?: string;

  /**
   * The ethereum provider
   */
  ethereumProvider?: string;

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
  blockPerBatch?: number;

  /**
   * The transaction hash
   */
  transactionHash?: string;

  /**
   * The sleep time between batches
   */
  sleep?: number;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the genProof command
 */
export interface GenProofsArgs {
  /**
   * The directory to store the proofs
   */
  outputDir: string;

  /**
   * The file to store the tally proof
   */
  tallyFile: string;

  /**
   * The path to the tally zkey file
   */
  tallyZkey: string;

  /**
   * The path to the process zkey file
   */
  processZkey: string;

  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * The file to store the subsidy proof
   */
  subsidyFile?: string;

  /**
   * The path to the subsidy zkey file
   */
  subsidyZkey?: string;

  /**
   * The path to the rapidsnark binary
   */
  rapidsnark?: string;

  /**
   * The path to the process witnessgen binary
   */
  processWitgen?: string;

  /**
   * The path to the process dat file
   */
  processDatFile?: string;

  /**
   * The path to the tally witnessgen binary
   */
  tallyWitgen?: string;

  /**
   * The path to the tally dat file
   */
  tallyDatFile?: string;

  /**
   * The path to the subsidy witnessgen binary
   */
  subsidyWitgen?: string;

  /**
   * The path to the subsidy dat file
   */
  subsidyDatFile?: string;

  /**
   * The coordinator's private key
   */
  coordinatorPrivKey?: string;

  /**
   * The address of the MACI contract
   */
  maciAddress?: string;

  /**
   * The transaction hash of the first transaction
   */
  transactionHash?: string;

  /**
   * The path to the process wasm file
   */
  processWasm?: string;

  /**
   * The path to the tally wasm file
   */
  tallyWasm?: string;

  /**
   * The path to the subsidy wasm file
   */
  subsidyWasm?: string;

  /**
   * Whether to use wasm or rapidsnark
   */
  useWasm?: boolean;

  /**
   * The file with the serialized maci state
   */
  stateFile?: string;

  /**
   * The block number to start fetching logs from
   */
  startBlock?: number;

  /**
   * The number of blocks to fetch logs from
   */
  blocksPerBatch?: number;

  /**
   * The block number to stop fetching logs from
   */
  endBlock?: number;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;

  /**
   * Whether to use quadratic voting or not
   */
  useQuadraticVoting?: boolean;

  /**
   * The address of the Tally contract
   */
  tallyAddress?: string;
}

/**
 * Interface for the arguments to the mergeMessages command
 */
export interface MergeMessagesArgs {
  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * The address of the MACI contract
   */
  maciContractAddress?: string;

  /**
   * The number of queue operations to merge
   */
  numQueueOps?: string;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the mergeSignups command
 */
export interface MergeSignupsArgs {
  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * The address of the MACI contract
   */
  maciContractAddress?: string;

  /**
   * The number of queue operations to perform
   */
  numQueueOps?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the ProveOnChainArgs command
 */
export interface ProveOnChainArgs {
  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * The directory containing the proofs
   */
  proofDir: string;

  /**
   * Whether to deploy subsidy contract
   */
  subsidyEnabled: boolean;

  /**
   * The address of the MACI contract
   */
  maciAddress?: string;

  /**
   * The address of the MessageProcessor contract
   */
  messageProcessorAddress?: string;

  /**
   * The address of the Tally contract
   */
  tallyAddress?: string;

  /**
   * The address of the Subsidy contract
   */
  subsidyAddress?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the publish command
 */
export interface PublishArgs {
  /**
   * The public key of the user
   */
  pubkey: string;

  /**
   * The index of the state leaf
   */
  stateIndex: bigint;

  /**
   * The index of the vote option
   */
  voteOptionIndex: bigint;

  /**
   * The nonce of the message
   */
  nonce: bigint;

  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * The new vote weight
   */
  newVoteWeight: bigint;

  /**
   * The address of the MACI contract
   */
  maciContractAddress?: string;

  /**
   * The salt of the message
   */
  salt?: bigint;

  /**
   * The private key of the user
   */
  privateKey?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the setVerifyingKeys command
 */
export interface SetVerifyingKeysArgs {
  /**
   * The depth of the state tree
   */
  stateTreeDepth: number;

  /**
   * The depth of the state subtree
   */
  intStateTreeDepth: number;

  /**
   * The depth of the message tree
   */
  messageTreeDepth: number;

  /**
   * The depth of the vote option tree
   */
  voteOptionTreeDepth: number;

  /**
   * The depth of the message batch tree
   */
  messageBatchDepth: number;

  /**
   * The path to the process messages zkey
   */
  processMessagesZkeyPath: string;

  /**
   * The path to the tally votes zkey
   */
  tallyVotesZkeyPath: string;

  /**
   * The address of the vkRegistry contract
   */
  vkRegistry?: string;

  /**
   * The path to the subsidy zkey
   */
  subsidyZkeyPath?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the signup command
 */
export interface SignupArgs {
  /**
   * The public key of the user
   */
  maciPubKey: string;

  /**
   * The address of the MACI contract
   */
  maciAddress?: string;

  /**
   * The signup gateway data
   */
  sgDataArg?: string;

  /**
   * The initial voice credit proxy data
   */
  ivcpDataArg?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the topup command
 */
export interface TopupArgs {
  /**
   * The amount to topup
   */
  amount: number;

  /**
   * The state index of the user
   */
  stateIndex: number;

  /**
   * The poll ID
   */
  pollId: bigint;

  /**
   * The address of the MACI contract
   */
  maciAddress?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
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
   * Whether to deploy subsidy contract
   */
  subsidyEnabled: boolean;

  /**
   * The path to the tally file with results, per vote option spent credits, spent voice credits total
   */
  tallyFile?: string;

  /**
   * The tally data
   */
  tallyData?: TallyData;

  /**
   * The address of the MACI contract
   */
  maciAddress?: string;

  /**
   * The address of the Tally contract
   */
  tallyAddress?: string;

  /**
   * The address of the Subsidy contract
   */
  subsidyAddress?: string;

  /**
   * The path to the subsidy file
   */
  subsidyFile?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the FundWallet command
 */
export interface FundWalletArgs {
  /**
   * The amount to fund
   */
  amount: number;

  /**
   * The address of the wallet to fund
   */
  address: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the TimeTravel command
 */
export interface TimeTravelArgs {
  /**
   * The number of seconds to time travel
   */
  seconds: number;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}

/**
 * Interface for the arguments to the DeployVkRegistry command
 */
export interface DeployVkRegistryArgs {
  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * A signer object
   */
  signer?: Signer;
}
