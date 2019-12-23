const path = require('path')
const compiler = require('circom')
const { Circuit } = require('snarkjs')
const { stringifyBigInts } = require('../_build/utils/helpers')

const {
  randomPrivateKey,
  privateToPublicKey,
  hash
} = require('../_build/utils/crypto')

const main = async () => {
  try {
    const circuitDef = await compiler(path.join(__dirname, 'ecdh_test.circom'))
    const circuit = new Circuit(circuitDef)

    const sk1 = randomPrivateKey()
    const pk1 = privateToPublicKey(sk1)

    const circuitInputs = {
      'public_key': stringifyBigInts(pk1),
      'private_key': stringifyBigInts(sk1)
    }

    const witness = circuit.calculateWitness(circuitInputs)

    const sBuff = Buffer.from(hash(sk1).toString()).slice(0, 32)
    sBuff[0] = sBuff[0] & 0xF8

    console.log(sBuff.toString(), sBuff.toString().length)
    console.log('-----------------------------------------')
    console.log(witness[circuit.outputIdx(0)].toString())
  } catch (e) {
    console.log(e)
  }
}

main()
