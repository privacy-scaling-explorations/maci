import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import { 
    genKeyPair,
    bigInt,
    stringifyBigInts,
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

        const cmd = new Command(
            bigInt(1),
            keypair.pubKey,
            bigInt(3),
            bigInt(4),
            bigInt(5),
        )

        const sig = cmd.sign(keypair.privKey)
        const msg = cmd.encrypt(keypair.privKey, sig)

        expect(Command.decrypt(keypair.privKey, msg).equals(cmd)).toBeTruthy()

        const circuitInputs = stringifyBigInts({
            'private_key': keypair.privKey,
            'message': msg.asCircuitInputs(),
        })

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        for (let i = 0; i < 11; i++) {
            const idx = circuit.getSignalIdx('main.out[' + i + ']')
            const circuitOut = witness[idx].toString()
            console.log(circuitOut)
        }
    })
})
