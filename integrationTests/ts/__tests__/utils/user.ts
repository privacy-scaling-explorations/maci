<<<<<<< HEAD:integrationTests/ts/__tests__/user.ts
import { Keypair, PrivKey } from "maci-domainobjs";

export interface Vote {
  voteOptionIndex: number;
  voteWeight: number;
  nonce: number;
  valid: boolean;
}
=======
import {
    Keypair,
    PrivKey
} from 'maci-domainobjs'
import { Vote } from './interfaces'
>>>>>>> 7319a99c (refactoring(integration-tests) - refactor integration tests):integrationTests/ts/__tests__/utils/user.ts

/**
 * A class representing a user and its votes
 */
export class UserCommand {
  public keypair: Keypair;
  public votes: Vote[];
  public voiceCreditBalance: bigint;
  public nonce: bigint;

<<<<<<< HEAD:integrationTests/ts/__tests__/user.ts
  constructor(keypair: Keypair, votes: Vote[], voiceCreditBalance: bigint, nonce: bigint) {
    this.keypair = keypair;
    this.votes = votes;
    this.voiceCreditBalance = voiceCreditBalance;
    this.nonce = nonce;
  }

  public changeKeypair(): PrivKey {
    const newUserKeypair = new Keypair();
    const oldPrivateKey = this.keypair.privKey;
    this.keypair = !newUserKeypair.equals(this.keypair) ? newUserKeypair : this.keypair;
    return oldPrivateKey;
  }

  // public static genBlankUser
  //
  // public static changeUserPubKey
=======
    /**
     * Create a new instance of a UserCommand object
     * @param _keypair the keypair of the user
     * @param _votes the votes casted by the user
     * @param _voiceCreditBalance the voice credit balance of the user
     * @param _nonce the nonce of the user
     */
    constructor(
        _keypair: Keypair,
        _votes: Vote[],
        _voiceCreditBalance: bigint,
        _nonce: bigint
    ) {
        this.keypair = _keypair;
        this.votes = _votes;
        this.voiceCreditBalance = _voiceCreditBalance;
    }

    /**
     * Helper function that can be used to change the keypair of the user
     * @returns 
     */
    public changeKeypair(): PrivKey {
        const newUserKeypair = new Keypair();
        const oldPrivateKey = this.keypair.privKey;
        this.keypair = !newUserKeypair.equals(this.keypair)
            ? newUserKeypair
            : this.keypair;
        return oldPrivateKey;
    }
>>>>>>> 7319a99c (refactoring(integration-tests) - refactor integration tests):integrationTests/ts/__tests__/utils/user.ts
}
