/**
 * A util interface that represents a vote object
 */
export interface Vote {
  voteOptionIndex: number;
  voteWeight: number;
  nonce: number;
  valid: boolean;
}

/**
 * A util interface that represents a subsidy file
 */
export interface Subsidy {
  provider: string;
  maci: string;
  pollId: number;
  newSubsidyCommitment: string;
  results: {
    subsidy: string[];
    salt: string;
  };
}
