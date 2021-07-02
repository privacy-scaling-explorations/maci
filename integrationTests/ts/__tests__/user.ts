import {
    Keypair,
    PrivKey
} from 'maci-domainobjs'

export interface Vote {
    voteOptionIndex: number;
    voteWeight: number;
    nonce: number;
    valid: boolean;
}

export class UserCommand {
    public keypair: Keypair
    public votes: Vote[]
    public voiceCreditBalance: BigInt

    constructor(
        _keypair: Keypair,
        _votes: Vote[],
        _voiceCreditBalance: BigInt,
        _nonce: BigInt,
    ) {
        this.keypair = _keypair
        this.votes = _votes
        this.voiceCreditBalance = BigInt(_voiceCreditBalance)
    }

    public changeKeypair(): PrivKey {
        const newUserKeypair = new Keypair()
        const oldPrivateKey = this.keypair.privKey
        this.keypair  = !newUserKeypair.equals(this.keypair) ? newUserKeypair : this.keypair
        return oldPrivateKey
    }

    // public static genBlankUser
    //
    // public static changeUserPubKey
}
