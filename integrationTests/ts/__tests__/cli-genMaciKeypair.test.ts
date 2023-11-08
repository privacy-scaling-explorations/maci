import {
    PubKey,
    PrivKey,
} from 'maci-domainobjs'
import {
    genPubKey,
} from 'maci-crypto'
import { genKeyPair } from 'maci-cli/ts/api'

describe('genMaciKeypair CLI subcommand', () => {
    it('genMaciKeypair should output a random private key and public key', async () => {
        const keypair1 = genKeyPair({ quiet: true })
        const keypair2 = genKeyPair({ quiet: true })

        // Invoking the same command twice should result in different private keys
        expect(keypair1.privateKey).not.toEqual(keypair2.privateKey)
        expect(keypair1.publicKey).not.toEqual(keypair2.publicKey)
        expect(PrivKey.unserialize(keypair1.privateKey)).toBeInstanceOf(PrivKey)
        expect(PubKey.unserialize(keypair1.publicKey)).toBeInstanceOf(PubKey)
        expect(PrivKey.unserialize(keypair2.privateKey)).toBeInstanceOf(PrivKey)
        expect(PubKey.unserialize(keypair2.publicKey)).toBeInstanceOf(PubKey)

        const publicKey2 = genPubKey(PrivKey.unserialize(keypair2.privateKey).rawPrivKey)
        expect(PubKey.unserialize(keypair2.publicKey).rawPubKey[0].toString()).toEqual(publicKey2[0].toString())
        expect(PubKey.unserialize(keypair2.publicKey).rawPubKey[1].toString()).toEqual(publicKey2[1].toString())
    })
})
