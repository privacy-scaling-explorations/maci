import type { CircuitConfig } from "circomkit";
import type { CircuitInputs } from "maci-core";

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
 * Inputs for circuit ProcessMessages
 */
export interface IProcessMessagesInputs {
  inputHash: bigint;
  packedVals: bigint;
  pollEndTimestamp: bigint;
  msgRoot: bigint;
  msgs: bigint[];
  msgSubrootPathElements: bigint[][];
  coordPrivKey: bigint;
  coordPubKey: [bigint, bigint];
  encPubKeys: bigint[];
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
}

/**
 * Inputs for circuit TallyVotes
 */
export interface ITallyVotesInputs {
  stateRoot: bigint;
  ballotRoot: bigint;
  sbSalt: bigint;
  packedVals: bigint;
  sbCommitment: bigint;
  currentTallyCommitment: bigint;
  newTallyCommitment: bigint;
  inputHash: bigint;
  ballots: bigint[];
  ballotPathElements: bigint[];
  votes: bigint[][];
  currentResults: bigint[];
  currentResultsRootSalt: bigint;
  currentSpentVoiceCreditSubtotal: bigint;
  currentSpentVoiceCreditSubtotalSalt: bigint;
  currentPerVOSpentVoiceCredits: bigint[];
  currentPerVOSpentVoiceCreditsRootSalt: bigint;
  newResultsRootSalt: bigint;
  newPerVOSpentVoiceCreditsRootSalt: bigint;
  newSpentVoiceCreditSubtotalSalt: bigint;
}

/**
 * Extend CircuitConfig type to include the name of the circuit
 */
export interface CircuitConfigWithName extends CircuitConfig {
  name: string;
}
