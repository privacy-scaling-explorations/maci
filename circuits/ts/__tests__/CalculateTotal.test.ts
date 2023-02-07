jest.setTimeout(90000)
import { 
    genWitness,
    getSignalByName,
} from './utils'

describe('CalculateTotal circuit', () => {
    it('should correctly sum a list of values', async () => {
        const circuit = 'calculateTotal_test'

        const nums: number[] = []
        for (let i=0; i < 6; i++) {
            nums.push(Math.floor(Math.random() * 100))
        }
        const sum = nums.reduce((a, b) => a + b, 0)

        const circuitInputs = {
            nums,
        }

        const witness = await genWitness(circuit, circuitInputs)
        const result = await getSignalByName(circuit, witness, 'main.sum')
        expect(result.toString()).toEqual(sum.toString())
    })
})
