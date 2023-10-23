import { Keypair, PubKey } from "../"
import { unpackPubKey } from "maci-crypto"

describe("public key", () => {

    it('isValidSerializedPubKey() should work correctly', () => {
        const k = new Keypair()
        const s = k.pubKey.serialize()

        expect(PubKey.isValidSerializedPubKey(s)).toBeTruthy()
        expect(PubKey.isValidSerializedPubKey(s + 'ffffffffffffffffffffffffffffff')).toBeFalsy()
        expect(PubKey.isValidSerializedPubKey(s.slice(1))).toBeFalsy()
    })

    it('serialize() and unserialize() should work correctly', () => {
        const k = new Keypair()
        const pk1 = k.pubKey

        const s = pk1.serialize()
        expect(s.startsWith('macipk.')).toBeTruthy()

        const d = s.slice(7)
        const unpacked = unpackPubKey(Buffer.from(d, 'hex'))

        expect(unpacked[0].toString()).toEqual(pk1.rawPubKey[0].toString())
        expect(unpacked[1].toString()).toEqual(pk1.rawPubKey[1].toString())
    })

    it('copy() should produce a deep copy', () => {
        const k = new Keypair()
        const pk1 = k.pubKey

        // shallow copy
        const pk2 = pk1

        expect(pk1.rawPubKey.toString()).toEqual(pk2.rawPubKey.toString())
        pk1.rawPubKey = [BigInt(0)]
        expect(pk1.rawPubKey.toString()).toEqual(pk2.rawPubKey.toString())

        // deep copy
        const k1 = new Keypair()
        const pk3 = k1.pubKey
        const pk4 = pk3.copy()
        expect(pk3.rawPubKey.toString()).toEqual(pk4.rawPubKey.toString())
        pk4.rawPubKey = [BigInt(0)]
        expect(pk3.rawPubKey.toString()).not.toEqual(pk4.rawPubKey.toString())
    })
})