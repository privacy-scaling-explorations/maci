const assert = require('chai').assert

const {
  randomPrivateKey,
  privateToPublicKey,
  signMiMC,
  verifyMiMC,
  ecdh,
  multiHash
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

    it('Sign and Verify', () => {
      const sk1 = randomPrivateKey()
      const pk1 = privateToPublicKey(sk1)

      const msg = multiHash([32767n])

      const signature = signMiMC(sk1, msg)

      const validSignature = verifyMiMC(
        msg,
        signature,
        pk1
      )
      assert.equal(validSignature, true)
    })
  })
})
