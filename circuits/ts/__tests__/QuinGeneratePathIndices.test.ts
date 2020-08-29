import {
    compileAndLoadCircuit,
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

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()
        const result: BigInt[] = []
        for (let i = 0; i < depth; i ++) {
            const idx = circuit.getSignalIdx('main.out[' + i + ']')
            result.push(BigInt(witness[idx].toString()))
        }
        expect(JSON.stringify(result.map((x) => x.toString()))).toEqual(
            JSON.stringify(toBase5(index))
        )
    })
})
