import { Keypair, PrivKey } from "../"
import { genKeypair } from "maci-crypto"
import { expect } from "chai"

describe("keypair", () => {
    it('the Keypair constructor should generate a random keypair if not provided a private key', () => {
        const k1 = new Keypair()
        const k2 = new Keypair()

        expect(k1.equals(k2)).to.be.false

        expect(k1.privKey.rawPrivKey).not.to.eq(k2.privKey.rawPrivKey)
    })

    it('the Keypair constructor should generate the correct public key given a private key', () => {
        const rawKeyPair = genKeypair()
        const k = new Keypair(new PrivKey(rawKeyPair.privKey))
        expect(rawKeyPair.pubKey[0]).to.eq(k.pubKey.rawPubKey[0])
        expect(rawKeyPair.pubKey[1]).to.eq(k.pubKey.rawPubKey[1])
    })
})