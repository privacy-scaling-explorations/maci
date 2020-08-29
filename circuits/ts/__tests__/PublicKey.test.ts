jest.setTimeout(90000)
import {
    Keypair,
} from 'maci-domainobjs'

import {
    compileAndLoadCircuit,
    executeCircuit,
    getSignalByName,
} from '../'

describe('Public key derivation circuit', () => {
    let circuit

    it('correctly computes a public key', async () => {
        circuit = await compileAndLoadCircuit('test/publicKey_test.circom')

        const keypair = new Keypair()

        const circuitInputs = {
            'private_key': keypair.privKey.asCircuitInputs(),
        }

        const witness = await executeCircuit(circuit, circuitInputs)

        const derivedPubkey0 = getSignalByName(circuit, witness, 'main.public_key[0]').toString()
        const derivedPubkey1 = getSignalByName(circuit, witness, 'main.public_key[1]').toString()
        expect(derivedPubkey0).toEqual(keypair.pubKey.rawPubKey[0].toString())
        expect(derivedPubkey1).toEqual(keypair.pubKey.rawPubKey[1].toString())
    })
})
