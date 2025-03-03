import type {
  ConstantInitialVoiceCreditProxy,
  FreeForAllGatekeeper,
  MACI,
  MockVerifier,
  MessageProcessorFactory,
  TallyFactory,
  PollFactory,
  PoseidonT3,
  PoseidonT4,
  PoseidonT5,
  PoseidonT6,
  VkRegistry,
} from "../typechain-types";
import type { BigNumberish, Signer, ContractFactory, Provider } from "ethers";
import type { CircuitInputs } from "maci-core";
import type { Keypair, Message, PubKey } from "maci-domainobjs";
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
  circuitInputs: CircuitInputs;
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
  gatekeeper?: FreeForAllGatekeeper;
  factories?: [ContractFactory, ContractFactory, ContractFactory, ContractFactory];
}

/**
 * An interface holding all of the smart contracts part of MACI.
 */
export interface IDeployedTestContracts {
  mockVerifierContract: MockVerifier;
  gatekeeperContract: FreeForAllGatekeeper;
  constantInitialVoiceCreditProxyContract: ConstantInitialVoiceCreditProxy;
  maciContract: MACI;
  vkRegistryContract: VkRegistry;
}

/**
 * An interface that represents an action that should
 * be applied to a MaciState and its Polls within the
 * genMaciState function.
 */
export interface Action {
  type: string;
  data: Partial<{
    pubKey: PubKey;
    encPubKey: PubKey;
    message: Message;
    voiceCreditBalance: number;
    timestamp: number;
    nullifier: bigint;
    newVoiceCreditBalance: bigint;
    stateIndex: number;
    numSrQueueOps: number;
    pollId: bigint;
    pollAddr: string;
    stateLeaf: bigint;
    messageRoot: bigint;
    ipfsHash: string;
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
   * The address of the SignUpTokenGatekeeper contract
   */
  signUpTokenGatekeeperContractAddress: string;

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
 * Parameters for the genProof function
 */
export interface IGenProofOptions {
  inputs: CircuitInputs;
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
  maciContractAddress: string;

  /**
   * Poll id
   */
  poll: number;
}

/**
 * Interface that represents maci state generation arguments
 */
export interface IGenMaciStateFromContractArgs {
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
