import { genMaciStateFromContract } from "maci-sdk";

import type { User } from "./user";
import type { Signer } from "ethers";
import type {
  MACI,
  Verifier,
  VkRegistry,
  FreeForAllGatekeeper,
  ConstantInitialVoiceCreditProxy,
  IIpfsMessage,
} from "maci-sdk";

/**
 * A util interface that represents a vote object
 */
export interface IVote {
  voteOptionIndex: bigint;
  voteWeight: bigint;
  nonce: bigint;
}

/**
 * A util interface that represents a briber object
 */
export interface IBriber {
  voteOptionIndices: bigint[];
}

/**
 * A util interface that represents a change user keys object
 */
export interface IChangeUsersKeys {
  voteOptionIndex: bigint;
  voteWeight: bigint;
}

/**
 * A util interface that represents a test suite
 */
export interface ITestSuite {
  name: string;
  description: string;
  numVotesPerUser: number;
  numUsers: number;
  expectedTally: number[];
  expectedSpentVoiceCredits: number[];
  expectedTotalSpentVoiceCredits: number;
  bribers?: IBriber[];
  votes?: IVote[][];
  changeUsersKeys?: IChangeUsersKeys[][];
}

/**
 * A util interface that represents deployed test contracts
 */
export interface IDeployedTestContracts {
  maci: MACI;
  verifier: Verifier;
  vkRegistry: VkRegistry;
  gatekeeper: FreeForAllGatekeeper;
  initialVoiceCreditProxy: ConstantInitialVoiceCreditProxy;
}

/**
 * A util interface that represents testing data from the TestingClass object
 */
export interface IContractsData {
  initialized: boolean;
  users?: User[];
  maciContractAddress?: string;
  maciState?: Awaited<ReturnType<typeof genMaciStateFromContract>>;
  polls?: string[];
}

export interface IRelayTestMessagesArgs {
  messages: IIpfsMessage[];
  maciAddress: string;
  signer: Signer;
  pollId: number;
}
