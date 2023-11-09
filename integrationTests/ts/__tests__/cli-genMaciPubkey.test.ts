import {
    PubKey,
    PrivKey,
} from 'maci-domainobjs'
import { 
    genPubKey,
} from 'maci-crypto'
import { genKeyPair, genMaciPubKey } from 'maci-cli'
import { expect } from "chai"

describe('genMaciPubkey CLI subcommand', () => {
    it('genMaciPubkey should output a correct public key', async () => {
        const keypair = genKeyPair({ quiet: true })
        const pubKey = genMaciPubKey({ privkey: keypair.privateKey, quiet: true })
     
        expect(pubKey).to.eq(keypair.publicKey)

        const unserialisedPrivkey = PrivKey.unserialize(keypair.privateKey)
        const pk2 = genPubKey(unserialisedPrivkey.rawPrivKey)
        const unserializedPk = PubKey.unserialize(keypair.publicKey)
        expect(unserializedPk.rawPubKey[0].toString()).to.eq(pk2[0].toString())
        expect(unserializedPk.rawPubKey[1].toString()).to.eq(pk2[1].toString())
    })
})
