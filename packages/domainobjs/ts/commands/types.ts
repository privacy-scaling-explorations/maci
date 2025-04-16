/**
 * @notice An interface representing a json T command
 */
export interface IJsonTCommand {
  stateIndex: string;
  amount: string;
  pollId: string;
}

/**
 * @notice An interface representing a json P command
 */
export interface IJsonPCommand {
  stateIndex: string;
  newPublicKey: string;
  voteOptionIndex: string;
  newVoteWeight: string;
  nonce: string;
  pollId: string;
  salt: string;
}
