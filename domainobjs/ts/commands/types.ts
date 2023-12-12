/**
 * @notice A parent interface for all the commands
 */
export interface ICommand {
  cmdType: bigint;
  copy: <T extends this>() => T;
  equals: <T extends this>(command: T) => boolean;
  toJSON: () => unknown;
}

/**
 * @notice An interface representing a generic json command
 */
export interface IJsonCommand {
  cmdType: string;
}

/**
 * @notice An interface representing a json T command
 */
export interface IJsonTCommand extends IJsonCommand {
  stateIndex: string;
  amount: string;
  pollId: string;
}

/**
 * @notice An interface representing a json P command
 */
export interface IJsonPCommand extends IJsonCommand {
  stateIndex: string;
  newPubKey: string;
  voteOptionIndex: string;
  newVoteWeight: string;
  nonce: string;
  pollId: string;
  salt: string;
}
