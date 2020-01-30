import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import { 
    genKeyPair,
    bigInt,
    stringifyBigInts,
    encrypt,
    genEcdhSharedKey,
} from 'maci-crypto'

import {
    Command,
    Message,
} from 'maci-domainobjs'

describe('Decryption circuit', () => {
    let circuit 
    beforeAll(async () => {
        // Compile circuit
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/decrypt_test.circom'))
        circuit = new Circuit(circuitDef)
    })

    it('Should decrypt a message inside the snark', async () => {
        const keypair = genKeyPair()
        const keypair2 = genKeyPair()
        const sharedKey = genEcdhSharedKey(
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
