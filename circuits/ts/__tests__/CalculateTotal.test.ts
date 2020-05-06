
import {
    compileAndLoadCircuit,
} from '../'


describe('CalculateTotal circuit', () => {
    it('should correctly sum a list of values', async () => {
        const ctCircuit = await compileAndLoadCircuit('test/calculateTotal_test.circom')

        const nums: number[] = []
        for (let i=0; i < 6; i++) {
            nums.push(Math.floor(Math.random() * 100))
        }
        const sum = nums.reduce((a, b) => a + b, 0)

        const circuitInputs = {
            nums,
        }

        const witness = ctCircuit.calculateWitness(circuitInputs)
        expect(ctCircuit.checkWitness(witness)).toBeTruthy()
        const resultIdx = ctCircuit.getSignalIdx('main.sum')
        const result = witness[resultIdx]
        expect(result.toString()).toEqual(sum.toString())
    })
})
