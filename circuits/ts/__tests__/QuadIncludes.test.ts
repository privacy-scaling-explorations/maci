import {
    compileAndLoadCircuit,
} from '../'

import { 
    stringifyBigInts,
} from 'maci-crypto'

describe('QuadIncludes circuit', () => {
    let circuit 
    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('test/quadIncludes_test.circom')
    })

    it('Should return the correct result', async () => {
        const items = [0, 1, 2, 3, 4]

        for (let i = 0; i < items.length; i ++) {
            const circuitInputs = stringifyBigInts({ items, target: i })

            const witness = circuit.calculateWitness(circuitInputs)
            expect(circuit.checkWitness(witness)).toBeTruthy()
            const idx = circuit.getSignalIdx('main.result')
            const result = witness[idx].toString()
            expect(result).toEqual('1')
        }

        const circuitInputs = stringifyBigInts({ items, target: 123 })
        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()
        const idx = circuit.getSignalIdx('main.result')
        const result = witness[idx].toString()
        expect(result).toEqual('0')
    })
})
