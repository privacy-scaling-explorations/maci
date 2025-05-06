/** An integer value is a numerical string, a number, or a bigint. */
export type IntegerValueType = `${number}` | number | bigint;

/** A signal value is a number, or an array of numbers (recursively). */
export type SignalValueType = IntegerValueType | SignalValueType[];

/**
 * Circuit inputs for testing the MessageValidator circuit
 */
export interface IMessageValidatorCircuitInputs {
  stateTreeIndex: SignalValueType;
  totalSignups: SignalValueType;
  voteOptionIndex: SignalValueType;
  voteOptions: SignalValueType;
  originalNonce: SignalValueType;
  commandNonce: SignalValueType;
  command: SignalValueType;
  publicKey: SignalValueType;
  signaturePoint: SignalValueType;
  signatureScalar: SignalValueType;
  currentVoiceCreditBalance: SignalValueType;
  currentVotesForOption: SignalValueType;
  voteWeight: SignalValueType;
}
