import { Keypair, type PrivKey } from "maci-domainobjs";

import type { IVote } from "./types";

/**
 * A class representing a user and its votes
 */
export class User {
  keypair: Keypair;

  votes: IVote[];

  voiceCreditBalance: bigint;

  nonce: bigint;

  stateLeafIndex?: bigint;

  /**
   * The timestamp of when the user joined the poll
   */
  timestamp?: bigint;

  /**
   * Create a new instance of a UserCommand object
   * @param _keypair the keypair of the user
   * @param votes the votes casted by the user
   * @param voiceCreditBalance the voice credit balance of the user
   * @param nonce the nonce of the user
   * @param timestamp the timestamp of when the user joined the poll
   */
  constructor(
    _keypair: Keypair,
    votes: IVote[],
    voiceCreditBalance: bigint,
    nonce: bigint,
    timestamp?: bigint,
    stateLeafIndex?: bigint,
  ) {
    this.keypair = _keypair;
    this.votes = votes;
    this.voiceCreditBalance = voiceCreditBalance;
    this.nonce = nonce;
    this.timestamp = timestamp;
    this.stateLeafIndex = stateLeafIndex;
  }

  /**
   * Helper function that can be used to change the keypair of the user
   * @returns
   */
  changeKeypair(): PrivKey {
    const newUserKeypair = new Keypair();
    const oldPrivateKey = this.keypair.privKey;
    this.keypair = !newUserKeypair.equals(this.keypair) ? newUserKeypair : this.keypair;
    return oldPrivateKey;
  }
}
