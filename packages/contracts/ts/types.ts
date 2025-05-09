import type { ECheckerFactories, EPolicyFactories } from "../tasks/helpers/types";
import type {
  Factory,
  ConstantInitialVoiceCreditProxy,
  MACI,
  MockVerifier,
  MessageProcessorFactory,
  TallyFactory,
  PollFactory,
  PoseidonT3,
  PoseidonT4,
  PoseidonT5,
  PoseidonT6,
  VerifyingKeysRegistry,
  IBasePolicy,
} from "../typechain-types";
import type { TypedContractMethod } from "../typechain-types/common";
import type { EMode, TCircuitInputs } from "@maci-protocol/core";
import type { Keypair, Message, PublicKey } from "@maci-protocol/domainobjs";
import type { BigNumberish, Signer, ContractFactory, Provider, BaseContract } from "ethers";
import type { PublicSignals } from "snarkjs";

/**
 * The data structure of the verifying key of the SNARK circuit.
 */
export interface IVerifyingKeyStruct {
  alpha1: {
    x: BigNumberish;
    y: BigNumberish;
  };
  beta2: {
    x: [BigNumberish, BigNumberish];
    y: [BigNumberish, BigNumberish];
  };
  gamma2: {
    x: [BigNumberish, BigNumberish];
    y: [BigNumberish, BigNumberish];
  };
  delta2: {
    x: [BigNumberish, BigNumberish];
    y: [BigNumberish, BigNumberish];
  };
  ic: {
    x: BigNumberish;
    y: BigNumberish;
  }[];
}

/**
 * The data structure representing a SNARK proof.
 */
export interface SnarkProof {
  pi_a: bigint[];
  pi_b: bigint[][];
  pi_c: bigint[];
}

/**
 * The data structure representing a Groth16 proof.
 */
export interface Groth16Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

/**
 * The data structure representing a proof output
 */
export interface Proof {
  proof: SnarkProof | Groth16Proof;
  circuitInputs: TCircuitInputs;
  publicInputs: PublicSignals;
}

/**
 * An interface that represents argument for deployment test contracts
 */
export interface IDeployedTestContractsArgs {
  initialVoiceCreditBalance: number;
  stateTreeDepth: number;
  signer?: Signer;
  quiet?: boolean;
  policy?: IBasePolicy;
  factories?: [ContractFactory, ContractFactory, ContractFactory, ContractFactory];
}

/**
 * An interface holding all of the smart contracts part of MACI.
 */
export interface IDeployedTestContracts {
  mockVerifierContract: MockVerifier;
  policyContract: IBasePolicy;
  constantInitialVoiceCreditProxyContract: ConstantInitialVoiceCreditProxy;
  maciContract: MACI;
  verifyingKeysRegistryContract: VerifyingKeysRegistry;
}

/**
 * An interface that represents an action that should
 * be applied to a MaciState and its Polls within the
 * generateMaciState function.
 */
export interface Action {
  type: string;
  data: Partial<{
    publicKey: PublicKey;
    encryptionPublicKey: PublicKey;
    message: Message;
    voiceCreditBalance: number;
    timestamp: number;
    nullifier: bigint;
    newVoiceCreditBalance: bigint;
    stateIndex: number;
    numSrQueueOps: number;
    pollId: bigint;
    pollAddresses: string;
    stateLeaf: bigint;
    messageRoot: bigint;
    ipfsHash: string;
    pollMode: EMode;
  }>;
  blockNumber: number;
  transactionIndex: number;
}

/**
 * An interface that represents the deployed Poseidon contracts.
 */
export interface IDeployedPoseidonContracts {
  PoseidonT3Contract: PoseidonT3;
  PoseidonT4Contract: PoseidonT4;
  PoseidonT5Contract: PoseidonT5;
  PoseidonT6Contract: PoseidonT6;
}

/**
 * An interface that represents the arguments for MACI contracts deployment.
 */
export interface IDeployMaciArgs {
  /**
   * The address of the policy contract
   */
  policyContractAddress: string;

  /**
   * The signer to use to deploy the contract
   */
  signer?: Signer;

  /**
   * Poseidon contract addresses (if not provided, they will be deployed automatically)
   */
  poseidonAddresses?: Partial<{
    poseidonT3: string;
    poseidonT4: string;
    poseidonT5: string;
    poseidonT6: string;
  }>;

  /**
   * Custom user defined factories
   */
  factories?: [ContractFactory, ContractFactory, ContractFactory, ContractFactory];

  /**
   * The depth of the state tree
   */
  stateTreeDepth?: number;

  /**
   * Whether to suppress console output
   */
  quiet?: boolean;
}

/**
 * An interface that represents the deployed MACI contracts.
 */
export interface IDeployedMaci {
  maciContract: MACI;
  pollFactoryContract: PollFactory;
  messageProcessorFactoryContract: MessageProcessorFactory;
  tallyFactoryContract: TallyFactory;
  poseidonAddrs: {
    poseidonT3: string;
    poseidonT4: string;
    poseidonT5: string;
    poseidonT6: string;
  };
}

/**
 * Interface that represents Verification key
 */
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
 * Return type for proof generation function
 */
export interface FullProveResult {
  proof: Groth16Proof;
  publicSignals: PublicSignals;
}

/**
 * Parameters for the generateProof function
 */
export interface IGenerateProofOptions {
  inputs: TCircuitInputs;
  zkeyPath: string;
  useWasm?: boolean;
  rapidsnarkExePath?: string;
  witnessExePath?: string;
  wasmPath?: string;
  silent?: boolean;
}

/**
 * Interface that represents IPFS message
 */
export interface IIpfsMessage {
  /**
   * User public key
   */
  publicKey: BigNumberish[];

  /**
   * Message data
   */
  data: string[];

  /**
   * Message hash
   */
  hash: string;

  /**
   * MACI contract address
   */
  maciAddress: string;

  /**
   * Poll id
   */
  poll: number;
}

/**
 * Interface that represents maci state generation arguments
 */
export interface IGenerateMaciStateFromContractArgs {
  /**
   * The ethereum provider
   */
  provider: Provider;

  /**
   * The address of the MACI contract
   */
  address: string;

  /**
   * The keypair of the coordinator
   */
  coordinatorKeypair: Keypair;

  /**
   * The id of the poll for which we are fetching events
   */
  pollId: bigint;

  /**
   * The block number from which to start fetching events
   */
  fromBlock?: number;

  /**
   * The number of blocks to fetch in each request
   */
  blocksPerRequest?: number;

  /**
   * The block number at which to stop fetching events
   */
  endBlock?: number;

  /**
   * The amount of time to sleep between each request
   */
  sleepAmount?: number;

  /**
   * Backup files for ipfs messages (name format: ipfsHash.json)
   */
  ipfsMessageBackupFiles?: string[];

  /**
   * The file path where to save the logs for debugging and auditing purposes
   */
  logsOutputPath?: string;
}

/**
 * Interface that represents log arguments
 */
export interface ILogArgs {
  /**
   * Text to log
   */
  text: string;

  /**
   * Whether to log the output
   */
  quiet?: boolean;
}

/**
 * Interface for the deploy policy arguments
 */
export interface IDeployPolicyArgs<FC extends BaseContract = BaseContract, FG extends BaseContract = BaseContract> {
  /**
   * Policy factory name
   */
  policyFactoryName: EPolicyFactories;

  /**
   * Checker factory name
   */
  checkerFactoryName: ECheckerFactories;

  /**
   * Policy factory
   */
  policyFactory: ContractFactory;

  /**
   * Checker factory
   */
  checkerFactory: ContractFactory;

  /**
   * Ethereum signer
   */
  signer: Signer;

  /**
   * Policy deploy args
   */
  policyArgs?: unknown[];

  /**
   * Checker deploy args
   */
  checkerArgs?: unknown[];

  /**
   * Proxy factories to reuse
   */
  factories?: TDeployedProxyFactories<FC, FG>;

  /**
   * Whether to suppress console output
   */
  quiet?: boolean;
}

/**
 * Type for the deployed proxy factories
 */
export type TDeployedProxyFactories<C extends BaseContract, P extends BaseContract> = Partial<{
  /**
   * Checker proxy factory
   */
  checker: C;

  /**
   * Policy proxy factory
   */
  policy: P;
}>;

/**
 * Interface for the get deployed policy proxy factories arguments
 */
export interface IGetDeployedPolicyProxyFactoriesArgs {
  /**
   * Policy proxy factory name
   */
  policy: EPolicyFactories;

  /**
   * Checker proxy factory name
   */
  checker: ECheckerFactories;

  /**
   * Ethereum signer
   */
  signer: Signer;

  /**
   * Network name
   */
  network: string;
}

/**
 * Type for the factory like contract
 */
export type IFactoryLike<T extends BaseContract> = Factory &
  T & {
    deploy: TypedContractMethod<unknown[], unknown, "nonpayable">;
  };

/**
 * Type for the account abstraction signer
 * @dev This is a workaround for the fact that ethers.js does not support account abstraction yet.
 * If isAA is true, then the transactions will be sent using a account abstraction relayer.
 * This means that the deploy contract transactions will be normal transactions (with `to` attribute)
 * and the contract address will be in the transaction logs instead of derived from the sender address.
 *
 * This interface helps the deployment scripts to detect and return the correct contract address.
 */
export interface AASigner extends Signer {
  /**
   * Flag to indicate if the signer is an account abstraction signer
   */
  isAA?: boolean;
}
