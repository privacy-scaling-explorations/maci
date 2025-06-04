import type { EMode } from "@maci-protocol/core";
import type { Signer } from "ethers";

/**
 * Interface for the tally file data.
 */
export interface ITallyData {
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
   * Voting mode
   */
  mode: EMode;

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
   * The per vote option spent voice credits.
   */
  perVoteOptionSpentVoiceCredits?: {
    /**
     * The tally of the per vote option spent voice credits.
     */
    tally: string[];

    /**
     * The salt of the per vote option spent voice credits.
     */
    salt: string;

    /**
     * The commitment of the per vote option spent voice credits.
     */
    commitment: string;
  };
}

/**
 * Interface for the arguments to the verifyProof command
 */
export interface IVerifyArgs {
  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * A signer object
   */
  signer: Signer;

  /**
   * The tally data
   */
  tallyData: ITallyData;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The tally commitments
   */
  tallyCommitments: ITallyCommitments;

  /**
   * The number of vote options
   */
  totalVoteOptions: number;

  /**
   * The vote option tree depth
   */
  voteOptionTreeDepth: number;
}

/**
 * Arguments for the generateTallyCommitments function
 */
export interface IGenerateTallyCommitmentsArgs {
  /**
   * The tally data
   */
  tallyData: ITallyData;
  /**
   * The vote option tree depth
   */
  voteOptionTreeDepth: number;
}

/**
 * Interface for the tally commitments
 */
export interface ITallyCommitments {
  /**
   * The new tally commitment
   */
  newTallyCommitment: bigint;
  /**
   * The new spent voice credits commitment
   */
  newSpentVoiceCreditsCommitment: bigint;
  /**
   * The new per vote option spent voice credits commitment
   */
  newPerVoteOptionSpentVoiceCreditsCommitment?: bigint;
  /**
   * The commitment to the results tree root
   */
  newResultsCommitment: bigint;
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
 * Get results args
 */
export interface IGetResultsArgs {
  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The ID of the poll
   */
  pollId: string;

  /**
   * The signer
   */
  signer: Signer;
}

/**
 * Get result per option args
 */
export interface IGetResultPerOptionArgs extends IGetResultsArgs {
  /**
   * The index of the vote option
   */
  index: number;
}

/**
 * Interface for the result of a voting option
 */
export interface IResult {
  /**
   * The result
   */
  value: bigint;

  /**
   * Whether the result is set or not
   */
  isSet: boolean;
}
