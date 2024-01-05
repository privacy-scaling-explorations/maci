import { Message, PubKey } from "maci-domainobjs";

import type {
  AccQueueQuinaryMaci,
  ConstantInitialVoiceCreditProxy,
  FreeForAllGatekeeper,
  MACI,
  MessageProcessor,
  MockVerifier,
  PollFactory,
  PoseidonT3,
  PoseidonT4,
  PoseidonT5,
  PoseidonT6,
  Subsidy,
  Tally,
  TopupCredit,
  VkRegistry,
} from "../typechain-types";
import type { BigNumberish, Fragment, JsonFragment } from "ethers";

// a type representing the ABI of a contract
export type TAbi = string | readonly (string | Fragment | JsonFragment)[];

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
 * An interface holding all of the smart contracts part of MACI.
 */
export interface IDeployedTestContracts {
  mockVerifierContract: MockVerifier;
  gatekeeperContract: FreeForAllGatekeeper;
  constantIntialVoiceCreditProxyContract: ConstantInitialVoiceCreditProxy;
  maciContract: MACI;
  stateAqContract: AccQueueQuinaryMaci;
  vkRegistryContract: VkRegistry;
  mpContract: MessageProcessor;
  tallyContract: Tally;
  topupCreditContract: TopupCredit;
  subsidyContract?: Subsidy;
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
    pollId: number;
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
 * An interface that represents the deployed MACI contracts.
 */
export interface IDeployedMaci {
  maciContract: MACI;
  stateAqContract: AccQueueQuinaryMaci;
  pollFactoryContract: PollFactory;
  poseidonAddrs: string[];
}
