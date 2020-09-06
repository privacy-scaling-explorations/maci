jest.setTimeout(90000)
import {
    compileAndLoadCircuit,
    executeCircuit,
    getSignalByName,
} from '../'

import { 
    stringifyBigInts,
} from 'maci-crypto'

describe('QuinSelector circuit', () => {
    let circuit 
    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('test/quinSelector_test.circom')
    })

    it('Should return the nth value given an index', async () => {
        const items = [0, 1, 2, 3, 4]

        for (let i = 0; i < items.length; i ++) {
            const circuitInputs = stringifyBigInts({ in: items, index: i })

            const witness = await executeCircuit(circuit, circuitInputs)
            const selected = getSignalByName(circuit, witness, 'main.out').toString()
            expect(selected).toEqual(items[i].toString())
        }
    })
})
