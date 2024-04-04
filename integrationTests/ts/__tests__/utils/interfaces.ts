import { MACI, Verifier, VkRegistry } from "maci-contracts";

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
}
