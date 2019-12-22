const assert = require('chai').assert

const {
  encrypt,
  decrypt,
  randomPrivateKey,
  privateToPublicKey,
  sign,
  verify,
  ecdh,
  multiHash,
  signAndEncrypt,
  decryptAndVerify
} = require('../_build/utils/crypto')

describe('Crypto.js', () => {
  describe('#Logic', () => {
    it('ECDH', async () => {
      const sk1 = randomPrivateKey()
      const sk2 = randomPrivateKey()

      const pk1 = privateToPublicKey(sk1)
      const pk2 = privateToPublicKey(sk2)

      const sharedKey1 = ecdh(sk1, pk2)
      const sharedKey2 = ecdh(sk2, pk1)

      assert.equal(sharedKey1.toString(), sharedKey2.toString())
    })

    it('Encrypt and Decrypt', async () => {
      const sk1 = randomPrivateKey()
      const sk2 = randomPrivateKey()

      const pk1 = privateToPublicKey(sk1)
      const pk2 = privateToPublicKey(sk2)

      const msg = [1n, 2n, 3n, 4n, 5n, 32767n]

      // Encryption relies on an ecdh key
      const encryptedMsg = encrypt(msg, sk1, pk2)

      const decryptedMsg = decrypt(encryptedMsg, sk2, pk1)

      assert.equal(decryptedMsg.length, msg.length)
      for (let i = 0; i < decryptedMsg.length; i++) {
        assert.equal(decryptedMsg[i].toString(), msg[i].toString())
      }
    })

    it('Sign and Verify', () => {
      const sk1 = randomPrivateKey()
      const pk1 = privateToPublicKey(sk1)

      const msg = multiHash([32767n])

      const signature = sign(sk1, msg)

      const validSignature = verify(
        msg,
        signature,
        pk1
      )
      assert.equal(validSignature, true)
    })

    it('Sign, Encrypt, Decrypt, and Verify', async () => {
      // Keys associated with the user and coordinator
      const skUser = randomPrivateKey()
      const skCoordinator = randomPrivateKey()

      const pkUser = privateToPublicKey(skUser)
      const pkCoordinator = privateToPublicKey(skCoordinator)

      // Randomly generated epemeral key used to encrypt
      // the vote
      const skEpemeral = randomPrivateKey()
      const pkEpemeral = privateToPublicKey(skEpemeral)

      const msg = [1n, 2n, 3n, 4n, 32767n, 999999999n]

      // Create a message, sign it with the nominated private key
      // and encrypt it with an epemeral ecdh key
      const encryptedMsg = signAndEncrypt(
        msg,
        skUser,
        skEpemeral,
        pkCoordinator
      )

      // Decrypt the message
      const valid = decryptAndVerify(
        encryptedMsg,
        pkUser,
        skCoordinator,
        pkEpemeral
      )

      const invalid = decryptAndVerify(
        encryptedMsg,
        privateToPublicKey(randomPrivateKey()),
        randomPrivateKey(),
        pkEpemeral
      )

      assert.equal(valid, true)
      assert.equal(invalid, false)
    })
  })
})
