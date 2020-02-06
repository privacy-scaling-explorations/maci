import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import {
    Keypair,
} from 'maci-domainobjs'

describe('Public key derivation circuit', () => {
    it('correctly computes a public key', async () => {
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/ecdh_test.circom'))
        const circuit = new Circuit(circuitDef)

        const keypair = new Keypair()
        const keypair2 = new Keypair()

        const ecdhSharedKey = Keypair.genEcdhSharedKey(
            keypair.privKey,
            keypair2.pubKey,
        )

        const circuitInputs = {
            'private_key': keypair.privKey.asCircuitInputs(),
            'public_key': keypair2.pubKey.asCircuitInputs(),
        }

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const circuitEcdhSharedKey = witness[circuit.getSignalIdx('main.shared_key')].toString()
        expect(circuitEcdhSharedKey).toEqual(ecdhSharedKey.toString())
    })
})
