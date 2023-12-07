import type { ICommand, IJsonTCommand } from "./types";

/**
 * @notice Command for submitting a topup request
 */
export class TCommand implements ICommand {
  cmdType: bigint;

  stateIndex: bigint;

  amount: bigint;

  pollId: bigint;

  /**
   * Create a new TCommand
   * @param stateIndex the state index of the user
   * @param amount the amount of voice credits
   * @param pollId the poll ID
   */
  constructor(stateIndex: bigint, amount: bigint, pollId: bigint) {
    this.cmdType = BigInt(2);
    this.stateIndex = stateIndex;
    this.amount = amount;
    this.pollId = pollId;
  }

  /**
   * Create a deep clone of this TCommand
   * @returns a copy of the TCommand
   */
  copy = <T extends TCommand>(): T => new TCommand(this.stateIndex, this.amount, this.pollId) as T;

  /**
   * Check whether this command has deep equivalence to another command
   * @param command the command to compare with
   * @returns whether they are equal or not
   */
  equals = (command: TCommand): boolean =>
    this.stateIndex === command.stateIndex &&
    this.amount === command.amount &&
    this.pollId === command.pollId &&
    this.cmdType === command.cmdType;

  /**
   * Serialize into a JSON object
   */
  toJSON(): IJsonTCommand {
    return {
      stateIndex: this.stateIndex.toString(),
      amount: this.amount.toString(),
      cmdType: this.cmdType.toString(),
      pollId: this.pollId.toString(),
    };
  }

  /**
   * Deserialize into a TCommand object
   * @param json - the json representation
   * @returns the TCommand instance
   */
  static fromJSON(json: IJsonTCommand): TCommand {
    return new TCommand(BigInt(json.stateIndex), BigInt(json.amount), BigInt(json.pollId));
  }
}
