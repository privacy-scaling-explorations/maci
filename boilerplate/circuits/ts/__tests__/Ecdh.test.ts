import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import {
    genKeyPair,
    bigInt,
    stringifyBigInts,
    formatPrivKeyForBabyJub,
    genEcdhSharedKey
} from 'maci-crypto'


describe('Public key derivation circuit', () => {
    it('correctly computes a public key', async () => {
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/ecdh_test.circom'))
        const circuit = new Circuit(circuitDef)

        const keypair = genKeyPair()
        const keypair2 = genKeyPair()

        const ecdhSharedKey = genEcdhSharedKey(
            keypair.privKey,
            keypair2.pubKey,
        )

        const circuitInputs = stringifyBigInts({
            'private_key': formatPrivKeyForBabyJub(keypair.privKey),
            'public_key': keypair2.pubKey,
        })

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const circuitEcdhSharedKey = witness[circuit.getSignalIdx('main.shared_key')].toString()
        expect(circuitEcdhSharedKey).toEqual(ecdhSharedKey.toString())
    })
})
