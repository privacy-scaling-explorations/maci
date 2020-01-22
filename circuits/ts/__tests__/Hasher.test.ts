import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')
import {
    stringifyBigInts,
    genRandomSalt,
    hashLeftRight,
    hashOne,
} from 'maci-crypto'

describe('MiMC hash circuits', () => {
    describe('Hasher', () => {
        it('correctly hashes one random value', async () => {
            const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/hasher_test.circom'))
            const circuit = new Circuit(circuitDef)
            const preImage = genRandomSalt()
            const circuitInputs = stringifyBigInts({
                in: [preImage],
                key: 0,
            })

            const witness = circuit.calculateWitness(circuitInputs)
            expect(circuit.checkWitness(witness)).toBeTruthy()

            const outputIdx = circuit.getSignalIdx('main.hash')
            const output = witness[outputIdx]

            const outputJS = hashOne(preImage)

            expect(output.toString()).toEqual(outputJS.toString())
        })
    })

    describe('HashLeftRight', () => {

        it('correctly hashes two random values', async () => {
            const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/hashleftright_test.circom'))
            const circuit = new Circuit(circuitDef)

            const left = genRandomSalt()
            const right = genRandomSalt()

            const circuitInputs = stringifyBigInts({ left, right })

            const witness = circuit.calculateWitness(circuitInputs)
            expect(circuit.checkWitness(witness)).toBeTruthy()

            const outputIdx = circuit.getSignalIdx('main.hash')
            const output = witness[outputIdx]

            const outputJS = hashLeftRight(left, right)

            expect(output.toString()).toEqual(outputJS.toString())
        })
    })
})
