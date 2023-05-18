jest.setTimeout(90000)
import {
    Keypair,
} from 'maci-domainobjs'

import { stringifyBigInts } from 'maci-crypto'

import { 
    genWitness,
    getSignalByName,
} from './utils'

describe('Verify knowledge of a private key', () => {
    const circuit = 'hasPrivateKey_test'

    it('should confirm knowledge of a correct private key', async () => {

        const keypair = new Keypair()

        const circuitInputs = stringifyBigInts({
            'privKey': keypair.privKey.asCircuitInputs(),
            'pubKey': keypair.pubKey.asCircuitInputs(),
        })

        const witness = await genWitness(circuit, circuitInputs)

        const isKeyCorrect = await getSignalByName(circuit, witness, 'main.isKeyCorrect')
        expect(BigInt(isKeyCorrect)).toEqual(BigInt(1));
    })

    it('should fail to verify knowledge of an invalid private key', async () => {

        const keypair = new Keypair()
        const badPrivKey = (new Keypair()).privKey;

        const circuitInputs = stringifyBigInts({
            'privKey': badPrivKey.asCircuitInputs(),
            'pubKey': keypair.pubKey.asCircuitInputs(),
        })

        const witness = await genWitness(circuit, circuitInputs)

        const isKeyCorrect = await getSignalByName(circuit, witness, 'main.isKeyCorrect')
        expect(BigInt(isKeyCorrect)).toEqual(BigInt(0));
    })
})
