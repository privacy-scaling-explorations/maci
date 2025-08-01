import { Keypair, type PrivateKey } from "@maci-protocol/domainobjs";

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
   * Create a new instance of a UserCommand object
   * @param keypair the keypair of the user
   * @param votes the votes casted by the user
   * @param voiceCreditBalance the voice credit balance of the user
   * @param nonce the nonce of the user
   * @param stateLeafIndex the state leaf index
   */
  constructor(keypair: Keypair, votes: IVote[], voiceCreditBalance: bigint, nonce: bigint, stateLeafIndex?: bigint) {
    this.keypair = keypair;
    this.votes = votes;
    this.voiceCreditBalance = voiceCreditBalance;
    this.nonce = nonce;
    this.stateLeafIndex = stateLeafIndex;
  }

  /**
   * Helper function that can be used to change the keypair of the user
   * @returns
   */
  changeKeypair(): PrivateKey {
    const newUserKeypair = new Keypair();
    const oldPrivateKey = this.keypair.privateKey;
    this.keypair = !newUserKeypair.equals(this.keypair) ? newUserKeypair : this.keypair;
    return oldPrivateKey;
  }
}
