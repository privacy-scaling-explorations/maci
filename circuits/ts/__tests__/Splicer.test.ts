jest.setTimeout(90000)
import {
    executeCircuit,
    getSignalByName,
    compileAndLoadCircuit,
} from '../'

import { 
    stringifyBigInts,
} from 'maci-crypto'

describe('Splice circuit', () => {
    let circuit 
    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('test/splicer_test.circom')
    })

    it('Should output the correct reconstructed level', async () => {
        expect.assertions(5)
        for (let index = 0; index < 5; index ++ ) {
            const items = [0, 20, 30, 40]
            const leaf  =  10
            const circuitInputs = stringifyBigInts({ in: items, leaf, index })

            const witness = await executeCircuit(circuit, circuitInputs)

            const output: BigInt[] = []
            for (let i = 0; i < items.length + 1; i ++) {
                const selected = getSignalByName(circuit, witness, `main.out[${i}]`).toString()
                output.push(BigInt(selected))
            }
            items.splice(index, 0, leaf)

            expect(JSON.stringify(stringifyBigInts(items.map(BigInt)))).toEqual(
                JSON.stringify(stringifyBigInts(output.map(BigInt)))
            )
        }
    })
})
