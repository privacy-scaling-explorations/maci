import {
    Keypair,
} from 'maci-domainobjs'

import {
    compileAndLoadCircuit,
} from '../'

describe('Public key derivation circuit', () => {
    let circuit

    it('correctly computes a public key', async () => {
        circuit = await compileAndLoadCircuit('test/publicKey_test.circom')

        const keypair = new Keypair()

        const circuitInputs = {
            'private_key': keypair.privKey.asCircuitInputs(),
        }

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const derivedPubkey0 = witness[circuit.getSignalIdx('main.public_key[0]')].toString()
        const derivedPubkey1 = witness[circuit.getSignalIdx('main.public_key[1]')].toString()
        expect(derivedPubkey0).toEqual(keypair.pubKey.rawPubKey[0].toString())
        expect(derivedPubkey1).toEqual(keypair.pubKey.rawPubKey[1].toString())
    })
})
