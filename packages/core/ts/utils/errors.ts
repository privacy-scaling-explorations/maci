/**
 * An enum describing the possible errors that can occur
 * in Poll.processMessage()
 */
export enum ProcessMessageErrors {
  InvalidCommand = "invalid command",
  InvalidStateLeafIndex = "invalid state leaf index",
  InvalidSignature = "invalid signature",
  InvalidNonce = "invalid nonce",
  InsufficientVoiceCredits = "insufficient voice credits",
  InvalidVoteOptionIndex = "invalid vote option index",
  FailedDecryption = "failed decryption due to either wrong encryption public key or corrupted ciphertext",
  IncorrectVoteWeightForFullCredit = "Vote weight must equal full available balance in FULL_CREDIT mode",
}

/**
 * A class which extends the Error class
 * which is to be used when an error occurs
 * in Poll.processMessage()
 */
export class ProcessMessageError extends Error {
  /**
   * Generate a new instance of the ProcessMessageError class
   * @param code - the error code
   */
  constructor(public code: ProcessMessageErrors) {
    super(code);
    this.name = this.constructor.name;
  }
}
