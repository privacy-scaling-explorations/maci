import {
    genPrivKey,
    genPubKey,
    genEcdhSharedKey,
    encrypt,
    decrypt,
    sign,
    verifySignature,
} from '../'

import * as snarkjs from 'snarkjs'

const SNARK_FIELD_SIZE = snarkjs.bigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617')

describe('Cryptographic operations', () => {
    const privKey = genPrivKey()
    const pubKey = genPubKey(privKey)
    const privKey1 = genPrivKey()
    const pubKey1 = genPubKey(privKey1)
    const ecdhSharedKey = genEcdhSharedKey(privKey, pubKey1)
    const ecdhSharedKey1 = genEcdhSharedKey(privKey1, pubKey)

    let plaintext: any[] = []
    for (let i = 0; i < 5; i ++) {
        plaintext.push(snarkjs.bigInt(Math.floor(Math.random() * 50)))
    }

    const ciphertext = encrypt(plaintext, ecdhSharedKey)
    const decryptedCiphertext = decrypt(ciphertext, ecdhSharedKey)

    describe('Public and private keys', () => {
        it('Private keys should be valid', () => {
            expect(privKey.lt(SNARK_FIELD_SIZE)).toBeTruthy()
            // TODO: add tests to ensure that the prune buffer step worked
        })

        it('Public keys should be valid', () => {
            // TODO: Figure out if these checks are correct and enough
            expect(pubKey[0].lt(SNARK_FIELD_SIZE)).toBeTruthy()
            expect(pubKey[1].lt(SNARK_FIELD_SIZE)).toBeTruthy()
        })
    })

    describe('ECDH shared key generation', () => {

        it ('Shared keys should match', () => {
            expect(ecdhSharedKey.toString()).toEqual(ecdhSharedKey1.toString())
        })

        it ('Shared keys should be valid', () => {
            // TODO: Figure out if this check is correct and enough
            expect(ecdhSharedKey.lt(SNARK_FIELD_SIZE)).toBeTruthy()
        })
    })

    describe('Encryption and decryption', () => {
        it ('Ciphertext should be of the correct format', () => {
            expect(ciphertext).toHaveLength(plaintext.length + 1)
        })

        it ('Ciphertext should differ from the plaintext', () => {
            expect.assertions(plaintext.length)
            for (let i = 0; i < plaintext.length; i++) {
                expect(plaintext[i] !== ciphertext[i+1]).toBeTruthy()
            }
        })

        it ('Ciphertext should be valid', () => {
            for (let i = 0; i < ciphertext.length; i++) {
                // TODO: Figure out if this check is correct and enough
                expect(ciphertext[i].lt(SNARK_FIELD_SIZE)).toBeTruthy()
            }
        })

        it ('The decrypted ciphertext should be correct', () => {
            expect.assertions(decryptedCiphertext.length)
            for (let i = 0; i < decryptedCiphertext.length; i++) {
                expect(decryptedCiphertext[i]).toEqual(plaintext[i])
            }
        })
    })

    describe('Signature generation and verification', () => {
        const message = snarkjs.bigInt(
            Math.floor(Math.random() * 100000)
        )
        const signature = sign(privKey, message)

        it ('The signature should have the correct format', () => {
            expect(signature).toHaveProperty('R8')
            expect(signature).toHaveProperty('S')
            expect(signature.R8[0].lt(SNARK_FIELD_SIZE)).toBeTruthy()
            expect(signature.R8[1].lt(SNARK_FIELD_SIZE)).toBeTruthy()
            expect(signature.S.lt(SNARK_FIELD_SIZE)).toBeTruthy()
        })

        it ('The signature should be valid', () => {
            const valid = verifySignature(
                message,
                signature,
                pubKey,
            )
            expect(valid).toBeTruthy()
        })
    })
})
