import type { MaciState } from "../MaciState";
import type { Poll } from "../Poll";
import type { PathElements } from "maci-crypto";
import type {
  Ballot,
  IJsonBallot,
  IJsonPCommand,
  IJsonStateLeaf,
  Keypair,
  Message,
  PCommand,
  PubKey,
  StateLeaf,
} from "maci-domainobjs";

/**
 * A circuit inputs for the circom circuit
 */
export type CircuitInputs = Record<string, string | bigint | bigint[] | bigint[][] | string[] | bigint[][][]>;

/**
 * This interface defines the tree depths.
 * @property intStateTreeDepth - The depth of the intermediate state tree.
 * @property messageTreeDepth - The depth of the message tree.
 * @property messageTreeSubDepth - The depth of the message tree sub.
 * @property voteOptionTreeDepth - The depth of the vote option tree.
 */
export interface TreeDepths {
  intStateTreeDepth: number;
  messageTreeDepth: number;
  messageTreeSubDepth: number;
  voteOptionTreeDepth: number;
}

/**
 * This interface defines the batch sizes.
 * @property tallyBatchSize - The size of the tally batch.
 * @property messageBatchSize - The size of the message batch.
 */
export interface BatchSizes {
  tallyBatchSize: number;
  messageBatchSize: number;
}

/**
 * Represents the public API of the MaciState class.
 */
export interface IMaciState {
  // This method is used for signing up users to the state tree.
  signUp(pubKey: PubKey, initialVoiceCreditBalance: bigint, timestamp: bigint): number;
  // This method is used for deploying poll.
  deployPoll(
    pollEndTimestamp: bigint,
    treeDepths: TreeDepths,
    messageBatchSize: number,
    coordinatorKeypair: Keypair,
  ): bigint;
  // These methods are helper functions.
  deployNullPoll(): void;
  copy(): MaciState;
  equals(m: MaciState): boolean;
  toJSON(): IJsonMaciState;
}

/**
 * An interface which represents the public API of the Poll class.
 */
export interface IPoll {
  // These methods are used for sending a message to the poll from user
  publishMessage(message: Message, encPubKey: PubKey): void;
  // These methods are used to generate circuit inputs
  processMessages(pollId: bigint): IProcessMessagesCircuitInputs;
  tallyVotes(): ITallyCircuitInputs;
  // These methods are helper functions
  hasUnprocessedMessages(): boolean;
  processAllMessages(): { stateLeaves: StateLeaf[]; ballots: Ballot[] };
  hasUntalliedBallots(): boolean;
  copy(): Poll;
  equals(p: Poll): boolean;
  toJSON(): IJsonPoll;
  setCoordinatorKeypair(serializedPrivateKey: string): void;
}

/**
 * This interface defines the JSON representation of a Poll
 */
export interface IJsonPoll {
  pollEndTimestamp: string;
  treeDepths: TreeDepths;
  batchSizes: BatchSizes;
  messages: unknown[];
  commands: IJsonPCommand[];
  ballots: IJsonBallot[];
  encPubKeys: string[];
  currentMessageBatchIndex: number;
  stateLeaves: IJsonStateLeaf[];
  results: string[];
  numBatchesProcessed: number;
  numSignups: string;
}

/**
 * This interface defines the JSON representation of a MaciState
 */
export interface IJsonMaciState {
  stateTreeDepth: number;
  polls: IJsonPoll[];
  stateLeaves: IJsonStateLeaf[];
  pollBeingProcessed: boolean;
  currentPollBeingProcessed: string;
  numSignUps: number;
}

/**
 * An interface describing the output of the processMessage function
 */
export interface IProcessMessagesOutput {
  stateLeafIndex?: number;
  newStateLeaf?: StateLeaf;
  originalStateLeaf?: StateLeaf;
  originalStateLeafPathElements?: PathElements;
  originalVoteWeight?: bigint;
  originalVoteWeightsPathElements?: PathElements;
  newBallot?: Ballot;
  originalBallot?: Ballot;
  originalBallotPathElements?: PathElements;
  command?: PCommand;
}

/**
 * An interface describing the circuit inputs to the ProcessMessage circuit
 */
export interface IProcessMessagesCircuitInputs {
  actualStateTreeDepth: string;
  pollEndTimestamp: string;
  numSignUps: string;
  batchEndIndex: string;
  index: string;
  maxVoteOptions: string;
  msgRoot: string;
  coordinatorPublicKeyHash: string;
  msgs: string[];
  msgSubrootPathElements: string[][];
  coordPrivKey: string;
  encPubKeys: string[];
  currentStateRoot: string;
  currentBallotRoot: string;
  currentSbCommitment: string;
  currentSbSalt: string;
  currentStateLeaves: string[];
  currentStateLeavesPathElements: string[][];
  currentBallots: string[];
  currentBallotsPathElements: string[][];
  currentVoteWeights: string[];
  currentVoteWeightsPathElements: string[][];
  newSbSalt: string;
  newSbCommitment: string;
}

/**
 * An interface describing the circuit inputs to the TallyVotes circuit
 */
export interface ITallyCircuitInputs {
  stateRoot: string;
  ballotRoot: string;
  sbSalt: string;
  sbCommitment: string;
  index: bigint;
  currentTallyCommitment: string;
  newTallyCommitment: string;
  numSignUps: bigint;
  ballots: string[];
  ballotPathElements: PathElements;
  votes: string[][];
  currentResults: string[];
  currentResultsRootSalt: string;
  currentSpentVoiceCreditSubtotal: string;
  currentSpentVoiceCreditSubtotalSalt: string;
  currentPerVOSpentVoiceCredits?: string[];
  currentPerVOSpentVoiceCreditsRootSalt?: string;
  newResultsRootSalt: string;
  newPerVOSpentVoiceCreditsRootSalt?: string;
  newSpentVoiceCreditSubtotalSalt: string;
}
