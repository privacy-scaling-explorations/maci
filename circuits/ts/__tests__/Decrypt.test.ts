
import {
    compileAndLoadCircuit,
} from '../'

import { 
    bigInt,
    stringifyBigInts,
    encrypt,
} from 'maci-crypto'

import {
    Keypair,
} from 'maci-domainobjs'

describe('Decryption circuit', () => {
    let circuit 
    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('test/decrypt_test.circom')
    })

    it('Should decrypt a message inside the snark', async () => {
        const keypair = new Keypair()
        const keypair2 = new Keypair()
        const sharedKey = Keypair.genEcdhSharedKey(
            keypair.privKey,
            keypair2.pubKey,
        )

        const cmd = [1, 2, 3, 4, 5].map((x) => bigInt(x))
        const msg = encrypt(cmd, sharedKey)

        const circuitInputs = stringifyBigInts({
            'private_key': sharedKey,
            'message': [msg.iv, ...msg.data],
        })

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        for (let i = 0; i < 4; i++) {
            const idx = circuit.getSignalIdx('main.out[' + i + ']')
            const circuitOut = witness[idx].toString()
            expect(circuitOut.toString()).toEqual(cmd[i].toString())
        }
    })
})
