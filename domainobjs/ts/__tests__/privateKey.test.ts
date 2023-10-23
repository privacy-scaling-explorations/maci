import { Keypair, PrivKey } from "../"

describe("privateKey", () => {
    it('PrivKey.serialize() and unserialize() should work correctly', () => {
        const k = new Keypair()
        const sk1 = k.privKey

        const s = sk1.serialize()
        expect(s.startsWith('macisk.')).toBeTruthy()

        const d = '0x' + s.slice(7)
        expect(sk1.rawPrivKey.toString()).toEqual(BigInt(d).toString())

        const c = PrivKey.unserialize(s)
        expect(sk1.rawPrivKey.toString()).toEqual(BigInt(`${c.rawPrivKey}`).toString())
    })

    it('PrivKey.isValidSerializedPrivKey() should work correctly', () => {
        const k = new Keypair()
        const s = k.privKey.serialize()

        expect(PrivKey.isValidSerializedPrivKey(s)).toBeTruthy()
        expect(PrivKey.isValidSerializedPrivKey(s.slice(1))).toBeFalsy()
    })
})