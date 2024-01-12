import { type SignalValueType } from "circomkit/dist/types/circuit";

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
