import { stringifyBigInts } from 'maci-crypto'

import { 
    genWitness,
    getSignalByName,
} from './utils'

import {
    Keypair,
} from 'maci-domainobjs'

describe('Public key derivation circuit', () => {
    const circuit = 'ecdh_test'

    it('correctly computes a public key', async () => {

        const keypair = new Keypair()
        const keypair2 = new Keypair()

        const ecdhSharedKey = Keypair.genEcdhSharedKey(
            keypair.privKey,
            keypair2.pubKey,
        )

        const circuitInputs = stringifyBigInts({
            'privKey': keypair.privKey.asCircuitInputs(),
            'pubKey': keypair2.pubKey.asCircuitInputs(),
        })

        const witness = await genWitness(circuit, circuitInputs)

        const circuitEcdhSharedKey = await getSignalByName(circuit, witness, 'main.sharedKey')
        expect(circuitEcdhSharedKey).toEqual(ecdhSharedKey.toString())
    })
})
