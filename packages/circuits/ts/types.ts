import type { CircuitConfig } from "circomkit";

export type BigNumberish = number | string | bigint;

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
 * Inputs for circuit PollJoining
 */
export interface IPollJoiningInputs {
  privateKey: bigint;
  pollPublicKey: bigint[][];
  stateLeaf: bigint[];
  siblings: bigint[][];
  index: bigint;
  nullifier: bigint;
  credits: bigint;
  stateRoot: bigint;
  actualStateTreeDepth: bigint;
  pollId: bigint;
}

/**
 * Inputs for circuit PollJoined
 */
export interface IPollJoinedInputs {
  privateKey: bigint;
  voiceCreditsBalance: bigint;
  stateLeaf: bigint[];
  pathElements: bigint[][];
  index: bigint;
  credits: bigint;
  stateRoot: bigint;
  actualStateTreeDepth: bigint;
}

/**
 * Inputs for circuit ProcessMessages
 */
export interface IProcessMessagesInputs {
  actualStateTreeDepth: bigint;
  totalSignups: bigint;
  batchEndIndex: bigint;
  index: bigint;
  inputBatchHash: bigint;
  outputBatchHash: bigint;
  messages: bigint[];
  coordinatorPrivateKey: bigint;
  coordinatorPublicKeyHash: bigint;
  encryptionPublicKeys: bigint[];
  currentStateRoot: bigint;
  currentStateLeaves: bigint[];
  currentStateLeavesPathElements: bigint[][];
  currentSbCommitment: bigint;
  currentSbSalt: bigint;
  newSbCommitment: bigint;
  newSbSalt: bigint;
  currentBallotRoot: bigint;
  currentBallots: bigint[];
  currentBallotsPathElements: bigint[][];
  currentVoteWeights: bigint[];
  currentVoteWeightsPathElements: bigint[][];
  voteOptions: bigint;
}

/**
 * Inputs for circuit VoteTally
 */
export interface IVoteTallyInputs {
  stateRoot: bigint;
  ballotRoot: bigint;
  sbSalt: bigint;
  index: bigint;
  totalSignups: bigint;
  sbCommitment: bigint;
  currentTallyCommitment: bigint;
  newTallyCommitment: bigint;
  ballots: bigint[];
  ballotPathElements: bigint[];
  votes: bigint[][];
  currentResults: bigint[];
  currentResultsRootSalt: bigint;
  currentSpentVoiceCreditSubtotal: bigint;
  currentSpentVoiceCreditSubtotalSalt: bigint;
  currentPerVoteOptionSpentVoiceCredits: bigint[];
  currentPerVoteOptionSpentVoiceCreditsRootSalt: bigint;
  newResultsRootSalt: bigint;
  newPerVoteOptionSpentVoiceCreditsRootSalt: bigint;
  newSpentVoiceCreditSubtotalSalt: bigint;
}

/**
 * Extend CircuitConfig type to include the name of the circuit
 */
export interface CircuitConfigWithName extends CircuitConfig {
  name: string;
}
