jest.setTimeout(90000)
import {
    Keypair,
} from 'maci-domainobjs'

import { stringifyBigInts } from 'maci-crypto'

import { 
    genWitness,
    getSignalByName,
} from './utils'

describe('Public key derivation circuit', () => {
    const circuit = 'publicKey_test'

    it('correctly computes a public key', async () => {

        const keypair = new Keypair()

        const circuitInputs = stringifyBigInts({
            'private_key': keypair.privKey.asCircuitInputs(),
        })

        const witness = await genWitness(circuit, circuitInputs)

        const derivedPubkey0 = await getSignalByName(circuit, witness, 'main.public_key[0]')
        const derivedPubkey1 = await getSignalByName(circuit, witness, 'main.public_key[1]')
        expect(derivedPubkey0).toEqual(keypair.pubKey.rawPubKey[0].toString())
        expect(derivedPubkey1).toEqual(keypair.pubKey.rawPubKey[1].toString())
    })
})
