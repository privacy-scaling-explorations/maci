import {
    genPrivKey,
    genPubKey,
    genKeyPair,
    genEcdhSharedKey,
    encrypt,
    decrypt,
    sign,
    hash,
    verifySignature,
} from '../'

import * as snarkjs from 'snarkjs'

const SNARK_FIELD_SIZE = snarkjs.bigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617')

describe('Cryptographic operations', () => {
    const { privKey, pubKey } = genKeyPair()
    const k = genKeyPair()

    const privKey1 = k.privKey
    const pubKey1 = k.pubKey

    const ecdhSharedKey = genEcdhSharedKey(privKey, pubKey1)
    const ecdhSharedKey1 = genEcdhSharedKey(privKey1, pubKey)

    let plaintext: any[] = []
    for (let i = 0; i < 5; i ++) {
        plaintext.push(snarkjs.bigInt(Math.floor(Math.random() * 50)))
    }

    const ciphertext = encrypt(plaintext, ecdhSharedKey)
    const decryptedCiphertext = decrypt(ciphertext, ecdhSharedKey)

    describe('Hashing', () => {
        it('The hash of a plaintext should be valid', () => {
            const h = hash(plaintext)
            expect(h.lt(SNARK_FIELD_SIZE)).toBeTruthy()
        })
    })

    describe('Public and private keys', () => {
        it('The private keys should be valid', () => {
            expect(privKey.lt(SNARK_FIELD_SIZE)).toBeTruthy()
            // TODO: add tests to ensure that the prune buffer step worked
        })

        it('The public keys should be valid', () => {
            // TODO: Figure out if these checks are correct and enough
            expect(pubKey[0].lt(SNARK_FIELD_SIZE)).toBeTruthy()
            expect(pubKey[1].lt(SNARK_FIELD_SIZE)).toBeTruthy()
        })
    })

    describe('ECDH shared key generation', () => {

        it ('The shared keys should match', () => {
            expect(ecdhSharedKey.toString()).toEqual(ecdhSharedKey1.toString())
        })

        it ('The shared keys should be valid', () => {
            // TODO: Figure out if this check is correct and enough
            expect(ecdhSharedKey.lt(SNARK_FIELD_SIZE)).toBeTruthy()
        })
    })

    describe('Encryption and decryption', () => {
        it ('The ciphertext should be of the correct format', () => {
            expect(ciphertext).toHaveProperty('iv')
            expect(ciphertext).toHaveProperty('data')
            expect(ciphertext.data).toHaveLength(plaintext.length)
        })

        it ('The ciphertext should differ from the plaintext', () => {
            expect.assertions(plaintext.length)
            for (let i = 0; i < plaintext.length; i++) {
                expect(plaintext[i] !== ciphertext[i+1]).toBeTruthy()
            }
        })

        it ('The ciphertext should be valid', () => {
            expect(ciphertext.iv.lt(SNARK_FIELD_SIZE)).toBeTruthy()
            for (let i = 0; i < ciphertext.data.length; i++) {
                // TODO: Figure out if this check is correct and enough
                expect(ciphertext.data[i].lt(SNARK_FIELD_SIZE)).toBeTruthy()
            }
        })

        it ('The decrypted ciphertext should be correct', () => {
            expect.assertions(decryptedCiphertext.length)

            for (let i = 0; i < decryptedCiphertext.length; i++) {
                expect(decryptedCiphertext[i]).toEqual(plaintext[i])
            }
        })

        it ('The plaintext should be incorrect if decrypted with a different key', () => {
            const sk = privKey + snarkjs.bigInt(1)
            const pk = genPubKey(sk)
            const differentKey = genEcdhSharedKey(sk, pk)

            const invalidPlaintext = decrypt(ciphertext, differentKey)

            expect.assertions(invalidPlaintext.length)

            for (let i = 0; i < decryptedCiphertext.length; i++) {
                expect(invalidPlaintext[i].eq(plaintext[i])).toBeFalsy()
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

        it ('The signature should be invalid for a different message', () => {
            const valid = verifySignature(
                message + snarkjs.bigInt(1),
                signature,
                pubKey,
            )
            expect(valid).toBeFalsy()
        })

        it ('The signature should be invalid if tampered with', () => {
            const valid = verifySignature(
                message,
                {
                    R8: signature.R8,
                    S: signature.S + snarkjs.bigInt(1),
                },
                pubKey,
            )
            expect(valid).toBeFalsy()
        })

        it ('The signature should be invalid for a different public key', () => {
            const valid = verifySignature(
                message,
                signature,
                pubKey1,
            )
            expect(valid).toBeFalsy()
        })
    })
})
