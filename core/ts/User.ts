import {
    PubKey,
    StateLeaf,
} from 'maci-domainobjs'

/*
 * Represents a User. In MACI, each user has a public key, a voice credit
 * balance, and the list of votes assigned to each vote option. You can convert
 * a User into a StateLeaf (from maci-domainobjs) but not the other way round.
 * @param _pubKey The user's public key
 * @param _votes The user's votes per vote option
 * @param _voiceCreditBalance The user's voice credit balance
 * @param _voiceCreditBalance The user's voice credit balance
 * @param _nonce The number of valid commands which the user has already
 *               published
 */
class User {
    public pubKey: PubKey
    public voiceCreditBalance: BigInt

    // The this is the current nonce. i.e. a user who has published 0 valid
    // command should have this value at 0, and the first command should
    // have a nonce of 1

    constructor(
        _pubKey: PubKey,
        _voiceCreditBalance: BigInt,
    ) {
        this.pubKey = _pubKey
        this.voiceCreditBalance = BigInt(_voiceCreditBalance)
    }

    /*
     * Return a deep copy of this User
     */
    public copy = (): User => {
        return new User(
            this.pubKey.copy(),
            BigInt(this.voiceCreditBalance.toString()),
        )
    }

    /*
     * Generate a user which should match a blank state leaf
     * @param _voteOptionTreeDepth The depth of the vote option tree
     */
    public static genBlankUser = (): User => {
        return new User(
            new PubKey([0, 0].map(BigInt)),
            BigInt(0),
        )
    }

    /*
     * Convert this User into a StateLeaf.
     */
    public genStateLeaf = (): StateLeaf => {
        return new StateLeaf(
            this.pubKey,
            this.voiceCreditBalance,
        )
    }

    public equals = (u: User): boolean => {
        return this.pubKey.equals(u.pubKey) &&
            this.voiceCreditBalance === u.voiceCreditBalance
    }
}

export { User }
