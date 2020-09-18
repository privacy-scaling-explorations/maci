jest.setTimeout(90000)
import {
    compileAndLoadCircuit,
    executeCircuit,
    getSignalByName,
} from '../'


describe('CalculateTotal circuit', () => {
    it('should correctly sum a list of values', async () => {
        const circuit = await compileAndLoadCircuit('test/calculateTotal_test.circom')

        const nums: number[] = []
        for (let i=0; i < 6; i++) {
            nums.push(Math.floor(Math.random() * 100))
        }
        const sum = nums.reduce((a, b) => a + b, 0)

        const circuitInputs = {
            nums,
        }

        const witness = await executeCircuit(circuit, circuitInputs)
        const result = getSignalByName(circuit, witness, 'main.sum').toString()
        expect(result.toString()).toEqual(sum.toString())
    })
})
