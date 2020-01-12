import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')
import {
    setupTree,
    genRandomSalt,
    Plaintext,
    bigInt,
    hashOne,
    hash,
    SnarkBigInt,
} from 'maci-crypto'

const ZERO_VALUE = 0

describe('State tree root update verification circuit', () => {
    let circuit 

    beforeAll(async () => {
        // Compile circuit
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/updateStateTree_test.circom'))
        circuit = new Circuit(circuitDef)
    })

    it('UpdateStateTree should produce the correct state root', async () => {
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/calculateTotal_test.circom'))
        const ctCircuit = new Circuit(circuitDef)

    })
})
