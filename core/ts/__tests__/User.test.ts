import {
    User,
} from '../'

import {
    StateLeaf,
} from 'maci-domainobjs'

import {
    IncrementalQuinTree,
    stringifyBigInts,
} from 'maci-crypto'

describe('User', () => {

    it('A blankUser should match a blank state leaf', async () => {
        const depth = 4
        const tree = new IncrementalQuinTree(4, BigInt(0))
        const user = User.genBlankUser(4)
        const stateLeaf = StateLeaf.genBlankLeaf(tree.root)
        expect(stateLeaf.hash().toString()).toEqual(user.genStateLeaf(depth).hash().toString())
    })

    it('serialize() and unserialize() should work', async () => {
        const user = User.genBlankUser(4)
        const s = user.serialize()
        const u = User.unserialize(s)

        expect(user.pubKey.rawPubKey[0].toString()).toEqual(u.pubKey.rawPubKey[0].toString())
        expect(user.pubKey.rawPubKey[1].toString()).toEqual(u.pubKey.rawPubKey[1].toString())
        expect(user.voiceCreditBalance.toString()).toEqual(u.voiceCreditBalance.toString())
        expect(user.nonce.toString()).toEqual(u.nonce.toString())
        expect(stringifyBigInts(user.votes)).toEqual(stringifyBigInts(u.votes))
    })
})
