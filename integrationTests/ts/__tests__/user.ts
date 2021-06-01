import {
    Keypair,
} from 'maci-domainobjs'

export interface Vote {
    voteOptionIndex: number;
    voteWeight: number;
    valid: boolean;
}

export class UserCommand {
    public keypair: Keypair
    public votes: Vote[]
    public voiceCreditBalance: BigInt
    public nonce: BigInt

     constructor(
        _keypair: Keypair,
        _votes: Vote[],
        _voiceCreditBalance: BigInt,
        _nonce: BigInt,
    ) {
        this.keypair = _keypair
        this.votes = _votes
        this.voiceCreditBalance = BigInt(_voiceCreditBalance)
        this.nonce = BigInt(_nonce)
    }

    // public static genBlankUser
    //
    // public static changeUserPubKey
}
