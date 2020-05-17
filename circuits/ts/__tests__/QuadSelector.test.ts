import {
    compileAndLoadCircuit,
} from '../'

import { 
    stringifyBigInts,
} from 'maci-crypto'

describe('QuadSelector circuit', () => {
    let circuit 
    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('test/quadSelector_test.circom')
    })

    it('Should return the nth value given an index', async () => {
        const items = [0, 1, 2, 3]

        for (let i = 0; i < items.length; i ++) {
            const circuitInputs = stringifyBigInts({ items, index: i })

            const witness = circuit.calculateWitness(circuitInputs)
            expect(circuit.checkWitness(witness)).toBeTruthy()
            const idx = circuit.getSignalIdx('main.selected')
            const selected = witness[idx].toString()
            expect(selected).toEqual(items[i].toString())
        }
    })
})
