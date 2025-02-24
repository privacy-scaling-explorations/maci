import type { Signer } from "ethers";
import type { CircuitInputs } from "maci-core";
import type { PubKey, IMessageContractParams } from "maci-domainobjs";
import type { Poll, SnarkProof } from "maci-sdk";
import type { Groth16Proof, PublicSignals } from "snarkjs";

export interface DeployedContracts {
  maciAddress: string;
  pollFactoryAddress: string;
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
  signupGatekeeper: string;
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
 * Interface for the arguments to the deploy command
 */
export interface DeployArgs {
  /**
   * The depth of the state tree
   */
  stateTreeDepth: number;

  /**
   * A signer object
   */
  signer: Signer;

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
}

/**
 * Interface for the arguments to the deployPoll command
 */
export interface DeployPollArgs {
  /**
   * The start date of the poll
   */
  pollStartDate: number;

  /**
   * The end date of the poll
   */
  pollEndDate: number;

  /**
   * The depth of the intermediate state tree
   */
  intStateTreeDepth: number;

  /**
   * The size of the message batch
   */
  messageBatchSize: number;

  /**
   * The depth of the vote option tree
   */
  voteOptionTreeDepth: number;

  /**
   * The coordinator's public key
   */
  coordinatorPubkey: string;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The relayer addresses
   */
  relayers?: string[];

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
   * Whether to use quadratic voting or not
   */
  useQuadraticVoting?: boolean;

  /**
   * The address of the gatekeeper contract
   */
  gatekeeperAddress?: string;

  /**
   * The address of the initial voice credit proxy contract
   */
  voiceCreditProxyAddress?: string;

  /**
   * The initial voice credits balance
   */
  initialVoiceCreditsBalance?: number;

  /**
   * The number of vote options
   */
  voteOptions?: number;
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

  /**
   * Whether to log the output
   */
  quiet: boolean;
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
   * The index of the public key in the state tree
   */
  stateIndex?: bigint;

  /**
   * Whether to log the output
   */
  quiet: boolean;

  /**
   * Path to the state file with MACI state
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
   * The transaction hash of the first transaction
   */
  transactionHash?: string;

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
   * The path to the poll witnessgen binary
   */
  pollWitgen?: string;

  /**
   * The path to the poll wasm file
   */
  pollWasm?: string;

  /**
   * The signup gatekeeper data
   */
  sgDataArg?: string;

  /**
   * The initial voice credit proxy data
   */
  ivcpDataArg?: string;
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
   * Joining poll timestamp
   */
  timestamp: string;

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
   * A signer object
   */
  signer: Signer;

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
   * Whether to use quadratic voting or not
   */
  useQuadraticVoting?: boolean;

  /**
   * Backup files for ipfs messages (name format: ipfsHash.json)
   */
  ipfsMessageBackupFiles?: string[];
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
   * A signer object
   */
  signer: Signer;

  /**
   * The tally file with results, per vote option spent credits, spent voice credits total
   */
  tallyFile?: string;

  /**
   * The address of the MACI contract
   */
  maciAddress?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
}

/**
 * Interface for the arguments to the publish command
 */
export interface PublishArgs extends IPublishMessage {
  /**
   * The poll public key
   */
  pubkey: string;

  /**
   * The poll private key
   */
  privateKey: string;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
}

/**
 * Interface for the arguments to the batch publish command
 */
export interface IPublishBatchArgs {
  /**
   * User messages
   */
  messages: IPublishMessage[];

  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The public key of the user
   */
  publicKey: string;

  /**
   * The private key of the user
   */
  privateKey: string;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
}

/**
 * Interface that represents user publish message
 */
export interface IPublishMessage {
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
   * The new vote weight
   */
  newVoteWeight: bigint;

  /**
   * The salt of the message
   */
  salt?: bigint;
}

/**
 * Interface that represents publish batch return data
 */
export interface IPublishBatchData {
  /**
   * Publish transaction hash
   */
  hash?: string;

  /**
   * Encrypted publish messages
   */
  encryptedMessages: IMessageContractParams[];

  /**
   * Encryption private keys
   */
  privateKeys: string[];
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
   * A signer object
   */
  signer: Signer;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
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
   * A signer object
   */
  signer: Signer;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
}

/**
 * Interface for the arguments to the DeployVkRegistry command
 */
export interface DeployVkRegistryArgs {
  /**
   * A signer object
   */
  signer: Signer;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
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
