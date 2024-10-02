import { MACI } from "maci-contracts/typechain-types";
import { PubKey } from "maci-domainobjs";

import type { Provider, Signer } from "ethers";
import type { SnarkProof } from "maci-contracts";
import type { CircuitInputs } from "maci-core";
import type { IMessageContractParams } from "maci-domainobjs";
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
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the VkRegistry contract
   */
  vkRegistry?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * Whether to use quadratic voting or not
   */
  useQuadraticVoting?: boolean;
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
   * A signer object
   */
  signer: Signer;

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
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the MACI contract
   */
  maciAddress?: string;

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
   * A signer object
   */
  signer: Signer;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * The address of the MACI contract
   */
  maciAddress?: string;

  /**
   * The number of queue operations to merge
   */
  numQueueOps?: string;
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
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the MACI contract
   */
  maciAddress?: string;

  /**
   * The number of queue operations to perform
   */
  numQueueOps?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
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
   * The public key of the user
   */
  pubkey: string;

  /**
   * The private key of the user
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
   * Encryption private key
   */
  privateKey: string;
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
   * The path to the process messages qv zkey
   */
  processMessagesZkeyPathQv?: string;

  /**
   * The path to the tally votes qv zkey
   */
  tallyVotesZkeyPathQv?: string;

  /**
   * The path to the process messages non-qv zkey
   */
  processMessagesZkeyPathNonQv?: string;

  /**
   * The path to the tally votes non-qv zkey
   */
  tallyVotesZkeyPathNonQv?: string;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the vkRegistry contract
   */
  vkRegistry?: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;

  /**
   * Whether to use quadratic voting or not
   */
  useQuadraticVoting?: boolean;
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
   * A signer object
   */
  signer: Signer;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

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
   * The voice credits of the user
   */
  voiceCredits: number;

  /**
   * The signup transaction hash
   */
  hash: string;
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

  /**
   * Whether to log the output
   */
  quiet?: boolean;
}

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

  /**
   * Whether to log the output
   */
  quiet?: boolean;
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
   * Whether to log the output
   */
  quiet?: boolean;
}

/**
 * Interface for the arguments for generate keypair command
 */
export interface IGenKeypairArgs {
  /**
   * Seed value for keypair
   */
  seed?: bigint;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
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

export interface ExtractVkToFileArgs {
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
 * Interface for the arguments to the getGatekeeperTrait command
 */
export interface IGetGatekeeperTraitArgs {
  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * A signer object
   */
  signer: Signer;
}

/**
 * Enum for the gatekeeper type
 */
export enum GatekeeperTrait {
  EAS = "EAS",
  FreeForAll = "FreeForAll",
  GitcoinPassport = "GitcoinPassport",
  Hats = "Hats",
  Semaphore = "Semaphore",
  Token = "Token",
  Zupass = "Zupass",
  MerkleProof = "MerkleProof",
}

/**
 * Interface for the arguments to the get a gatekeeper's data command
 */
export interface IGetGatekeeperDataArgs {
  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * A signer object
   */
  signer: Signer;
}

/**
 * Interface for the semaphore gatekeeper data
 */
export interface ISemaphoreGatekeeperData {
  /**
   * The address of the semaphore gatekeeper
   */
  address: string;

  /**
   * The group ID
   */
  groupId: string;
}

/**
 * Interface for the zupass gatekeeper data
 */
export interface IZupassGatekeeperData {
  /**
   * The event ID
   */
  eventId: string;

  /**
   * The first signer
   */
  signer1: string;

  /**
   * The second signer
   */
  signer2: string;
}

/**
 * Interface for the EAS gatekeeper data
 */
export interface IEASGatekeeperData {
  /**
   * The EAS
   */
  eas: string;

  /**
   * The schema
   */
  schema: string;

  /**
   * The attester
   */
  attester: string;
}

/**
 * Interface for the Hats gatekeeper data
 */
export interface IHatsGatekeeperData {
  /**
   * The criterion hat(s)
   */
  criterionHat: string[];

  /**
   * The hats contract
   */
  hatsContract: string;
}

/**
 * Interface for the MerkleProof gatekeeper data
 */
export interface IMerkleProofGatekeeperData {
  /**
   * The merkle tree root
   */
  root: string;
}
