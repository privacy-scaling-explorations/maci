import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')
import {
    hashLeftRight,
} from 'maci-crypto'

describe('MiMC hash circuits', () => {
    describe('HashLeftRight', () => {

        it('correctly hashes two random values', async () => {
            const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/hashleftright_test.circom'))
            const circuit = new Circuit(circuitDef)

            const left = Math.floor(Math.random() * 10000)
            const right = Math.floor(Math.random() * 10000)

            const circuitInputs = { left, right }

            const witness = circuit.calculateWitness(circuitInputs)

            const outputIdx = circuit.getSignalIdx('main.hash')
            const output = witness[outputIdx]

            const outputJS = hashLeftRight(left, right)

            expect(output.toString()).toEqual(outputJS.toString())
        })
    })
})
