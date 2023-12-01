import { Keypair, PrivKey } from "maci-domainobjs";
import { Vote } from "./interfaces";

/**
 * A class representing a user and its votes
 */
export class UserCommand {
  public keypair: Keypair;
  public votes: Vote[];
  public voiceCreditBalance: bigint;
  public nonce: bigint;

  /**
   * Create a new instance of a UserCommand object
   * @param _keypair the keypair of the user
   * @param _votes the votes casted by the user
   * @param _voiceCreditBalance the voice credit balance of the user
   * @param _nonce the nonce of the user
   */
  constructor(_keypair: Keypair, _votes: Vote[], _voiceCreditBalance: bigint, _nonce: bigint) {
    this.keypair = _keypair;
    this.votes = _votes;
    this.voiceCreditBalance = _voiceCreditBalance;
    this.nonce = _nonce;
  }

  /**
   * Helper function that can be used to change the keypair of the user
   * @returns
   */
  public changeKeypair(): PrivKey {
    const newUserKeypair = new Keypair();
    const oldPrivateKey = this.keypair.privKey;
    this.keypair = !newUserKeypair.equals(this.keypair) ? newUserKeypair : this.keypair;
    return oldPrivateKey;
  }
}
