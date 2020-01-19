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
        //encPubKey,
        newPubKey,
        bigInt(0),
        bigInt(9),
        bigInt(123),
    )

    describe('Commands and Messages', () => {
        const signature = command.sign(privKey)
        const message = command.encrypt(ecdhSharedKey, signature)

        it ('command.sign() should produce a valid signature', () => {
            expect(command.verifySignature(signature, pubKey)).toBeTruthy()
        })
        
        it ('A decrypted message should match the original command', () => {
            const decryptedCommand = Command.decrypt(ecdhSharedKey, message)
            expect(decryptedCommand.equals(command)).toBeTruthy()
        })
    })
})
