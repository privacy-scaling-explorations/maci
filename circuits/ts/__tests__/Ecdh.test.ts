import {
    compileAndLoadCircuit,
} from '../'

import {
    Keypair,
} from 'maci-domainobjs'

describe('Public key derivation circuit', () => {
    let circuit

    it('correctly computes a public key', async () => {
        circuit = await compileAndLoadCircuit('test/ecdh_test.circom')

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
