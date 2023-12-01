import { Keypair, PrivKey } from "maci-domainobjs";

export interface Vote {
  voteOptionIndex: number;
  voteWeight: number;
  nonce: number;
  valid: boolean;
}

export class UserCommand {
  public keypair: Keypair;
  public votes: Vote[];
  public voiceCreditBalance: bigint;
  public nonce: bigint;

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
}
