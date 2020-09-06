jest.setTimeout(90000)
import {
    compileAndLoadCircuit,
    executeCircuit,
    getSignalByName,
} from '../'

const toBase5 = (x: number) => {
    const result: number[] = []
    while(true) {
        if (x == 0) {
            break
        }
        result.push(x % 5)
        x = Math.floor(x / 5)
    }
    return result
}

describe('QuinGeneratePathIndices circuit', () => {
    let circuit 
    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('test/quinGeneratePathIndices_test.circom')
    })

    it('Should return the correct result', async () => {
        const index = 600

        const depth = 4
        const circuitInputs = {
            in: index
        }

        const witness = await executeCircuit(circuit, circuitInputs)
        const result: number[] = []
        for (let i = 0; i < depth; i ++) {
            const out = getSignalByName(circuit, witness, `main.out[${i}]`)
            result.push(Number(out))
        }
        expect(JSON.stringify(result)).toEqual(JSON.stringify(toBase5(index)))
    })
})
