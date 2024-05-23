/** An integer value is a numerical string, a number, or a bigint. */
export type IntegerValueType = `${number}` | number | bigint;

/** A signal value is a number, or an array of numbers (recursively). */
export type SignalValueType = IntegerValueType | SignalValueType[];

/**
 * Circuit inputs for testing the MessageValidator circuit
 */
export interface IMessageValidatorCircuitInputs {
  stateTreeIndex: SignalValueType;
  numSignUps: SignalValueType;
  voteOptionIndex: SignalValueType;
  maxVoteOptions: SignalValueType;
  originalNonce: SignalValueType;
  nonce: SignalValueType;
  cmd: SignalValueType;
  pubKey: SignalValueType;
  sigR8: SignalValueType;
  sigS: SignalValueType;
  currentVoiceCreditBalance: SignalValueType;
  currentVotesForOption: SignalValueType;
  voteWeight: SignalValueType;
  slTimestamp: SignalValueType;
  pollEndTimestamp: SignalValueType;
}
