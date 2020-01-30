import {
    Command,
    Message,
} from '../'

import {
    encrypt,
    sign,
    decrypt,
    verifySignature,
    genKeyPair,
    genEcdhSharedKey,
    bigInt,
} from 'maci-crypto'

describe('Domain objects', () => {
    const { privKey, pubKey } = genKeyPair()
    const k = genKeyPair()

    const privKey1 = k.privKey
    const pubKey1 = k.pubKey

    const encKeypair = genKeyPair()
    const encPrivKey = k.privKey
    const encPubKey = k.pubKey

    const newKeypair = genKeyPair()
    const newPrivKey = k.privKey
    const newPubKey = k.pubKey

    const ecdhSharedKey = genEcdhSharedKey(privKey, pubKey1)

    const command: Command = new Command(
        bigInt(10),
        newPubKey,
        bigInt(0),
        bigInt(9),
        bigInt(123),
    )

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
    })
})
