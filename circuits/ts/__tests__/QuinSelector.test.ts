jest.setTimeout(900000)
import { 
    genWitness,
    getSignalByName,
} from './utils'

import { 
    stringifyBigInts,
} from 'maci-crypto'

describe('QuinSelector circuit', () => {
    const circuit = 'quinSelector_test'

    it('Should return the nth value given an index', async () => {
        const items = [0, 1, 2, 3, 4]

        for (let i = 0; i < items.length; i ++) {
            const circuitInputs = stringifyBigInts({ in: items, index: i })

            const witness = await genWitness(circuit, circuitInputs)
            const selected = await getSignalByName(circuit, witness, 'main.out')
            expect(selected).toEqual(items[i].toString())
        }
    })
})
