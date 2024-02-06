import type {
  AccQueueQuinaryMaci,
  ConstantInitialVoiceCreditProxy,
  FreeForAllGatekeeper,
  MACI,
  MockVerifier,
  PollFactory,
  PoseidonT3,
  PoseidonT4,
  PoseidonT5,
  PoseidonT6,
  TopupCredit,
  VkRegistry,
} from "../typechain-types";
import type { BigNumberish, Signer } from "ethers";
import type { Message, PubKey } from "maci-domainobjs";

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
 * An interface holding all of the smart contracts part of MACI.
 */
export interface IDeployedTestContracts {
  mockVerifierContract: MockVerifier;
  gatekeeperContract: FreeForAllGatekeeper;
  constantIntialVoiceCreditProxyContract: ConstantInitialVoiceCreditProxy;
  maciContract: MACI;
  stateAqContract: AccQueueQuinaryMaci;
  vkRegistryContract: VkRegistry;
  topupCreditContract: TopupCredit;
}

/**
 * An interface that representes an action that should
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
    stateIndex: number;
    numSrQueueOps: number;
    pollId: bigint;
    pollAddr: string;
    stateRoot: bigint;
    messageRoot: bigint;
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
   * The address of the ConstantInitialVoiceCreditProxy contract
   */
  initialVoiceCreditBalanceAddress: string;

  /**
   * The address of the TopupCredit contract
   */
  topupCreditContractAddress: string;

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
  stateAqContract: AccQueueQuinaryMaci;
  pollFactoryContract: PollFactory;
  poseidonAddrs: {
    poseidonT3: string;
    poseidonT4: string;
    poseidonT5: string;
    poseidonT6: string;
  };
}
