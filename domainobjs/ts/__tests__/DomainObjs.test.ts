import {
    StateLeaf,
    Command,
    Keypair,
    PrivKey,
    PubKey,
} from '../'

import {
    genKeypair,
    unpackPubKey,
} from 'maci-crypto'

describe('Domain objects', () => {
    const { privKey, pubKey } = new Keypair()
    const k = new Keypair()

    const pubKey1 = k.pubKey

    const newPubKey = k.pubKey

    const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, pubKey1)

    const command: Command = new Command(
        BigInt(10),
        newPubKey,
        BigInt(0),
        BigInt(9),
        BigInt(123),
    )

    describe('State leaves', () => {
        it('The serialize() and unserialize() functions should work correctly', () => {
            const stateLeaf = new StateLeaf(
                pubKey,
                BigInt(123),
                BigInt(456),
                BigInt(789),
            )

            const serialized = stateLeaf.serialize()
            const unserialized = StateLeaf.unserialize(serialized)

            expect(unserialized.voteOptionTreeRoot.toString()).toEqual(stateLeaf.voteOptionTreeRoot.toString())
            expect(unserialized.voiceCreditBalance.toString()).toEqual(stateLeaf.voiceCreditBalance.toString())
            expect(unserialized.nonce.toString()).toEqual(stateLeaf.nonce.toString())
        })
    })

    describe('Keypairs', () => {
        it('the Keypair constructor should generate a random keypair if not provided a private key', () => {
            const k1 = new Keypair()
            const k2 = new Keypair()

            expect(k1.equals(k2)).toBeFalsy()

            expect(k1.privKey.rawPrivKey).not.toEqual(k2.privKey.rawPrivKey)
        })

        it('the Keypair constructor should generate the correct public key given a private key', () => {
            const rawKeyPair = genKeypair()
            const k = new Keypair(new PrivKey(rawKeyPair.privKey))
            expect(rawKeyPair.pubKey[0]).toEqual(k.pubKey.rawPubKey[0])
            expect(rawKeyPair.pubKey[1]).toEqual(k.pubKey.rawPubKey[1])
        })

        it('PrivKey.serialize() and unserialize() should work correctly', () => {
            const k = new Keypair()
            const sk1 = k.privKey

            const s = sk1.serialize()
            expect(s.startsWith('macisk.')).toBeTruthy()

            const d = '0x' + s.slice(7)
            expect(sk1.rawPrivKey.toString()).toEqual(BigInt(d).toString())

            const c = PrivKey.unserialize(s)
            expect(sk1.rawPrivKey.toString()).toEqual(BigInt(c.rawPrivKey).toString())
        })

        it('PrivKey.isValidSerializedPrivKey() should work correctly', () => {
            const k = new Keypair()
            const s = k.privKey.serialize()

            expect(PrivKey.isValidSerializedPrivKey(s)).toBeTruthy()
            expect(PrivKey.isValidSerializedPrivKey(s.slice(1))).toBeFalsy()
        })

        it('PubKey.isValidSerializedPubKey() should work correctly', () => {
            const k = new Keypair()
            const s = k.pubKey.serialize()

            expect(PubKey.isValidSerializedPubKey(s)).toBeTruthy()
            expect(PubKey.isValidSerializedPubKey(s + 'ffffffffffffffffffffffffffffff')).toBeFalsy()
            expect(PubKey.isValidSerializedPubKey(s.slice(1))).toBeFalsy()
        })

        it('PubKey.serialize() and unserialize() should work correctly', () => {
            const k = new Keypair()
            const pk1 = k.pubKey

            const s = pk1.serialize()
            expect(s.startsWith('macipk.')).toBeTruthy()

            const d = s.slice(7)
            const unpacked = unpackPubKey(Buffer.from(d, 'hex'))

            expect(unpacked[0].toString()).toEqual(pk1.rawPubKey[0].toString())
            expect(unpacked[1].toString()).toEqual(pk1.rawPubKey[1].toString())
        })

        it('PrivKey.copy() should produce a deep copy', () => {
            const k = new Keypair()
            const sk1 = k.privKey

            // shallow copy
            const sk2 = sk1

            expect(sk1.rawPrivKey.toString()).toEqual(sk2.rawPrivKey.toString())
            sk1.rawPrivKey = BigInt(0)
            expect(sk1.rawPrivKey.toString()).toEqual(sk2.rawPrivKey.toString())

            // deep copy
            const k1 = new Keypair()
            const sk3 = k1.privKey
            const sk4 = sk3.copy()
            expect(sk3.rawPrivKey.toString()).toEqual(sk4.rawPrivKey.toString())
            sk4.rawPrivKey = BigInt(0)
            expect(sk3.rawPrivKey.toString()).not.toEqual(sk4.rawPrivKey.toString())
        })

        it('PubKey.copy() should produce a deep copy', () => {
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

        it('Keypair.copy() should produce a deep copy', () => {
            const k1 = new Keypair()

            // shallow copy
            const k2 = k1

            expect(k1.privKey.rawPrivKey.toString()).toEqual(k2.privKey.rawPrivKey.toString())
            k1.privKey.rawPrivKey = BigInt(0)
            expect(k1.privKey.rawPrivKey.toString()).toEqual(k2.privKey.rawPrivKey.toString())

            // deep copy
            const k3 = new Keypair()
            const k4 = k3.copy()
            expect(k3.privKey.rawPrivKey.toString()).toEqual(k4.privKey.rawPrivKey.toString())

            k3.privKey.rawPrivKey = BigInt(0)
            expect(k3.privKey.rawPrivKey.toString()).not.toEqual(k4.privKey.rawPrivKey.toString())
        })
    })

    describe('Commands and Messages', () => {
        const signature = command.sign(privKey)
        const message = command.encrypt(signature, ecdhSharedKey)
        const decrypted = Command.decrypt(message, ecdhSharedKey)

        it ('command.sign() should produce a valid signature', () => {
            expect(command.verifySignature(signature, pubKey)).toBeTruthy()
        })
        
        it ('A decrypted message should match the original command', () => {
            expect(decrypted.command.equals(command)).toBeTruthy()
            expect(decrypted.signature.R8[0]).toEqual(signature.R8[0])
            expect(decrypted.signature.R8[1]).toEqual(signature.R8[1])
            expect(decrypted.signature.S).toEqual(signature.S)
        })

        it ('A decrypted message should have a valid signature', () => {
            expect(decrypted.command.verifySignature(decrypted.signature, pubKey)).toBeTruthy()
        })

        it('Command.copy() should perform a deep copy', () => {
            const c1: Command = new Command(
                BigInt(10),
                newPubKey,
                BigInt(0),
                BigInt(9),
                BigInt(123),
            )

            // shallow copy
            const c2 = c1
            c1.nonce = BigInt(9999)
            expect(c1.nonce.toString()).toEqual(c2.nonce.toString())

            // deep copy
            const c3 = c1.copy()
            c1.nonce = BigInt(8888)

            expect(c1.nonce.toString()).not.toEqual(c3.nonce.toString())
        })

        it('Message.copy() should perform a deep copy', () => {
            const c = command.copy()
            const m1 = c.encrypt(signature, ecdhSharedKey)

            const m2 = m1
            m1.iv = BigInt(9999)
            expect(m1.iv.toString()).toEqual(m2.iv.toString())

            const m3 = m1.copy()
            m1.iv = BigInt(8888)
            expect(m1.iv.toString()).not.toEqual(m3.iv.toString())
        })
    })
})
