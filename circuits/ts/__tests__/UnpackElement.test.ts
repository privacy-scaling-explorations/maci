jest.setTimeout(90000)
import { 
    genWitness,
    getSignalByName,
} from './utils'

import { 
    genRandomSalt,
    stringifyBigInts,
} from 'maci-crypto'


describe('UnpackElement circuit', () => {
    it('Should unpack a field element with 5 packed values correctly', async () => {
        const circuit = 'unpackElement_test'
        const elements: string[] = []
        for (let i = 0; i < 5; i ++) {
            let e = (BigInt(genRandomSalt()) % (BigInt(2 ** 50))).toString(2)
            while (e.length < 50) {
                e = '0' + e
            }
            elements.push(e)
        }

        const circuitInputs = stringifyBigInts({
            'in': BigInt('0b' + elements.join(''))
        })

        const witness = await genWitness(circuit, circuitInputs)

        for (let i = 0; i < 5; i ++) {
            const out = await getSignalByName(circuit, witness, `main.out[${i}]`)
            expect(BigInt('0b' + BigInt(out).toString(2)).toString())
                .toEqual(BigInt('0b' + elements[i]).toString())
        }
    })

    it('Should unpack a field element with 4 packed values correctly', async () => {
        const circuit = 'unpackElement4_test'
        const elements: string[] = []
        for (let i = 0; i < 4; i ++) {
            let e = (BigInt(genRandomSalt()) % (BigInt(2 ** 50))).toString(2)
            while (e.length < 50) {
                e = '0' + e
            }
            elements.push(e)
        }

        const circuitInputs = stringifyBigInts({
            'in': BigInt('0b' + elements.join(''))
        })

        const witness = await genWitness(circuit, circuitInputs)

        for (let i = 0; i < 4; i ++) {
            const out = await getSignalByName(circuit, witness, `main.out[${i}]`)
            expect(BigInt('0b' + BigInt(out).toString(2)).toString())
                .toEqual(BigInt('0b' + elements[i]).toString())
        }
    })
})
