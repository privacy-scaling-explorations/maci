const path = require('path')
const { assert } = require('chai')
const compiler = require('circom')
const { stringifyBigInts } = require('../_build/utils/helpers')
const { Circuit } = require('snarkjs')
const { hashLeftRight } = require('../_build/utils/crypto')

const {
  randomPrivateKey,
  privateToPublicKey,
  encrypt,
  decrypt,
  ecdh
} = require('../_build/utils/crypto')

describe('Circom Ciruits', () => {
  describe('Hasher', () => {
    it('#HashOutput', async () => {
      const circuitDef = await compiler(path.join(__dirname, 'hashleftright_test.circom'))
      const circuit = new Circuit(circuitDef)

      const left = 32767n
      const right = 1337n

      const circuitInputs = {
        'left': stringifyBigInts(left),
        'right': stringifyBigInts(right)
      }

      const witness = circuit.calculateWitness(circuitInputs)

      const outputIdx = circuit.getSignalIdx('main.hash')
      const output = witness[outputIdx]

      const outputJS = hashLeftRight(left, right)

      assert.equal(output.toString(), outputJS.toString())
    })
  })

  describe('Decrypt', () => {
    it('#Decryption', async () => {
      const circuitDef = await compiler(path.join(__dirname, 'decrypt_test.circom'))
      const circuit = new Circuit(circuitDef)

      const sk1 = randomPrivateKey()
      const sk2 = randomPrivateKey()

      const pk1 = privateToPublicKey(sk1)
      const pk2 = privateToPublicKey(sk2)

      const sharedKey = ecdh(sk2, pk1)

      const msg = [3n, 4n, 5n, 32767n]

      const encryptedMsg = encrypt(msg, sk1, pk2)

      const circuitInputs = {
        'message': stringifyBigInts(encryptedMsg),
        'private_key': stringifyBigInts(sharedKey)
      }

      const witness = circuit.calculateWitness(circuitInputs)

      // Get the outputs
      for (let i = 0; i < msg.length; i++) {
        const idx = circuit.outputIdx(i)
        assert.equal(msg[i].toString(), witness[idx].toString())
      }
    })
  })
})

