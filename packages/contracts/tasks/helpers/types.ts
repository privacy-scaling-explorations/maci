import type { Proof } from "../../ts/types";
import type { AccQueue, MACI, MessageProcessor, Poll, Tally, Verifier, VkRegistry } from "../../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type {
  BaseContract,
  BigNumberish,
  Fragment,
  JsonFragment,
  Signer,
  ContractFactory,
  Interface,
  InterfaceAbi,
} from "ethers";
import type { Libraries, TaskArguments } from "hardhat/types";
import type { Poll as PollWrapper } from "maci-core";
import type { Keypair, PrivKey } from "maci-domainobjs";

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
 * Interface that represents task prove params
 */
export interface IProveParams {
  /**
   * The poll id
   */
  poll: BigNumberish;

  /**
   * Coordinator's private key
   */
  coordinatorPrivateKey: string;

  /**
   * The path to the rapidsnark binary
   */
  rapidsnark?: string;

  /**
   * The directory to store the proofs
   */
  outputDir: string;

  /**
   * The path to the process zkey file
   */
  processZkey: string;

  /**
   * The path to the process witnessgen binary
   */
  processWitgen?: string;

  /**
   * The path to the process wasm file
   */
  processWasm?: string;

  /**
   * The file to store the tally proof
   */
  tallyFile: string;

  /**
   * The path to the tally zkey file
   */
  tallyZkey: string;

  /**
   * The path to the tally witnessgen binary
   */
  tallyWitgen?: string;

  /**
   * The path to the tally wasm file
   */
  tallyWasm?: string;

  /**
   * Whether to use quadratic voting or not
   */
  useQuadraticVoting?: boolean;

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
   * The transaction hash of the first transaction
   */
  transactionHash?: string;
}

/**
 * Interface that represents prove generator params
 */
export interface IProofGeneratorParams {
  /**
   * Poll class (see maci-core)
   */
  poll: PollWrapper;

  /**
   * MACI contract address
   */
  maciContractAddress: string;

  /**
   * Tally contract address
   */
  tallyContractAddress: string;

  /**
   * Directory to store the proofs
   */
  outputDir: string;

  /**
   * File to store the tally proof
   */
  tallyOutputFile: string;

  /**
   * Message processing circuit files
   */
  mp: ICircuitFiles;

  /**
   * Tally circuit files
   */
  tally: ICircuitFiles;

  /**
   * Path to the rapidsnark binary
   */
  rapidsnark?: string;

  /**
   * Whether to use quadratic voting or not
   */
  useQuadraticVoting?: boolean;
}

/**
 * Interface that groups files for circuits (zkey, witgen, wasm)
 */
export interface ICircuitFiles {
  /**
   * The path to the zkey file
   */
  zkey: string;

  /**
   * The path to the witnessgen binary
   */
  witgen?: string;

  /**
   * The path to the wasm file
   */
  wasm?: string;
}

/**
 * Interface that represents prepare maci state params
 */
export interface IPrepareStateParams {
  /**
   * MACI contract
   */
  maciContract: MACI;

  /**
   * Poll contract
   */
  pollContract: Poll;

  /**
   * MessageAq contract
   */
  messageAq: AccQueue;

  /**
   * Poll id
   */
  pollId: BigNumberish;

  /**
   * MACI private key
   */
  maciPrivateKey: PrivKey;

  /**
   * Coordinator keypair
   */
  coordinatorKeypair: Keypair;

  /**
   * Eth signer
   */
  signer: Signer;

  /**
   * The directory to store the proofs
   */
  outputDir: string;

  /**
   * Options for state (on-chain fetching or local file)
   */
  options: Partial<{
    /**
     * The file with the serialized maci state
     */
    stateFile: string;

    /**
     * The block number to start fetching logs from
     */
    startBlock: number;

    /**
     * The number of blocks to fetch logs from
     */
    blocksPerBatch: number;

    /**
     * The block number to stop fetching logs from
     */
    endBlock: number;

    /**
     * The transaction hash of the first transaction
     */
    transactionHash: string;
  }>;
}

/**
 * Interface that represents generate proof options
 */
export interface IGenerateProofsOptions {
  /**
   * Hook to call when batch generation is completed
   *
   * @param data - batch data
   */
  onBatchComplete?: (data: IGenerateProofsBatchData) => void;

  /**
   * Hook to call when proof generation is completed
   *
   * @param data - proof generated data
   * @param tally - tally data
   */
  onComplete?: (data: Proof[], tally?: TallyData) => void;

  /**
   * Hook to call when generation is failed
   *
   * @param error - error
   */
  onFail?: (error: Error) => void;
}

/**
 * Interface that represents batch data
 */
export interface IGenerateProofsBatchData {
  /**
   * Batch proofs
   */
  proofs: Proof[];

  /**
   * Current batch
   */
  current: number;

  /**
   * Total batches
   */
  total: number;
}

/**
 * Interface that represents prover params
 */
export interface IProverParams {
  /**
   * Poll contract typechain wrapper
   */
  pollContract: Poll;

  /**
   * MessageProcessor contract typechain wrapper
   */
  mpContract: MessageProcessor;

  /**
   * AccQueue contract typechain wrapper (messages)
   */
  messageAqContract: AccQueue;

  /**
   * MACI contract typechain wrapper
   */
  maciContract: MACI;

  /**
   * VkRegistry contract typechain wrapper
   */
  vkRegistryContract: VkRegistry;

  /**
   * Verifier contract typechain wrapper
   */
  verifierContract: Verifier;

  /**
   * Tally contract typechain wrapper
   */
  tallyContract: Tally;
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
 * Interface that represents `Deployment#getContract` params
 */
export interface IGetContractParams {
  /**
   * Contract name
   */
  name: EContracts;

  /**
   * Group key
   */
  key?: string;

  /**
   * Contract address
   */
  address?: string;

  /**
   * Contract abi
   */
  abi?: Interface | InterfaceAbi;

  /**
   * Eth signer
   */
  signer?: Signer;
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
   * Deployment Transaction Hash
   */
  deploymentTxHash?: string;

  /**
   * Params for verification
   */
  verify?: {
    args?: string;
    name?: string;
    impl?: string;
    subType?: string;
  };
}

/**
 * Interface that represents register contract arguments
 */
export interface IRegisterContract<ID = EContracts> {
  /**
   * Contract enum identifier
   */
  id: ID;

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

  /**
   * Contract name with path specified
   */
  name?: string;
}

/**
 * Enum represents gatekeeper types
 */
export enum EGatekeepers {
  FreeForAll = "FreeForAllGatekeeper",
  EAS = "EASGatekeeper",
  GitcoinPassport = "GitcoinPassportGatekeeper",
  Hats = "HatsGatekeeper",
  HatsSingle = "HatsGatekeeperSingle",
  HatsMultiple = "HatsGatekeeperMultiple",
  Zupass = "ZupassGatekeeper",
  Semaphore = "SemaphoreGatekeeper",
  MerkleProof = "MerkleProofGatekeeper",
  SignUp = "SignUpGatekeeper",
}

/**
 * Enum represents initial voice credit proxies
 */
export enum EInitialVoiceCreditProxies {
  Constant = "ConstantInitialVoiceCreditProxy",
}

/**
 * Enum represents deployed contracts
 */
export enum EContracts {
  ConstantInitialVoiceCreditProxy = "ConstantInitialVoiceCreditProxy",
  FreeForAllGatekeeper = "FreeForAllGatekeeper",
  EASGatekeeper = "EASGatekeeper",
  GitcoinPassportGatekeeper = "GitcoinPassportGatekeeper",
  HatsGatekeeper = "HatsGatekeeper",
  HatsGatekeeperSingle = "HatsGatekeeperSingle",
  HatsGatekeeperMultiple = "HatsGatekeeperMultiple",
  ZupassGatekeeper = "ZupassGatekeeper",
  ZupassGroth16Verifier = "ZupassGroth16Verifier",
  SemaphoreGatekeeper = "SemaphoreGatekeeper",
  MerkleProofGatekeeper = "MerkleProofGatekeeper",
  SignUpGatekeeper = "SignUpGatekeeper",
  Verifier = "Verifier",
  MACI = "MACI",
  StateAq = "StateAq",
  PollFactory = "PollFactory",
  MessageProcessorFactory = "MessageProcessorFactory",
  TallyFactory = "TallyFactory",
  PoseidonT3 = "PoseidonT3",
  PoseidonT4 = "PoseidonT4",
  PoseidonT5 = "PoseidonT5",
  PoseidonT6 = "PoseidonT6",
  VkRegistry = "VkRegistry",
  Poll = "Poll",
  Tally = "Tally",
  MessageProcessor = "MessageProcessor",
  AccQueue = "AccQueue",
  AccQueueQuinaryBlankSl = "AccQueueQuinaryBlankSl",
  AccQueueQuinaryMaci = "AccQueueQuinaryMaci",
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
 * Interface that represents verification subtask arguments
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
   * Poll contract
   */
  pollContract: Poll;

  /**
   * Message AccQueue contract
   */
  messageAccQueueContract: AccQueue;
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

// a type representing the ABI of a contract
export type TAbi = string | readonly (string | Fragment | JsonFragment)[];

/**
 * Interface that represents deploy params
 */
export interface IDeployContractParams<ID = EContracts> {
  /**
   * Contract name
   */
  name: ID;

  /**
   * Contract abi
   */
  abi?: TAbi;

  /**
   * Contract bytecode
   */
  bytecode?: string;

  /**
   * Eth signer
   */
  signer?: Signer;
}

/**
 * Interface that represents deploy params
 */
export interface IDeployContractWithLinkedLibrariesParams {
  /**
   * Contract factory
   */
  contractFactory: ContractFactory;

  /**
   * Eth signer
   */
  signer?: Signer;
}
