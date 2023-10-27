import { 
    getSignal,
} from './utils'

import { 
    genRandomSalt,
    stringifyBigInts,
} from 'maci-crypto'
import * as path from 'path'
import { expect } from 'chai'
const tester = require("circom_tester").wasm

describe('UnpackElement circuit', () => {
    let circuit: any 


    describe('UnpackElement', () => {
        before(async () => {
            const circuitPath = path.join(__dirname, '../../circom/test', `unpackElement_test.circom`)
            circuit = await tester(circuitPath)
        })

        it('Should unpack a field element with 5 packed values correctly', async () => {
            const elements: string[] = []
            for (let i = 0; i < 5; i ++) {
                let e = (BigInt(genRandomSalt().toString()) % (BigInt(2 ** 50))).toString(2)
                while (e.length < 50) {
                    e = '0' + e
                }
                elements.push(e)
            }
    
            const circuitInputs = stringifyBigInts({
                'in': BigInt('0b' + elements.join(''))
            })
    
            const witness = await circuit.calculateWitness(circuitInputs)
            await circuit.checkConstraints(witness)
    
            for (let i = 0; i < 5; i ++) {
                const out = await getSignal(circuit, witness, `out[${i}]`)
                expect(BigInt('0b' + BigInt(out).toString(2)).toString())
                    .to.be.eq(BigInt('0b' + elements[i]).toString())
            }
        })
    })
    
    describe("unpackElement4", () => {
        before(async () => {
            const circuitPath = path.join(__dirname, '../../circom/test', `unpackElement4_test.circom`)
            circuit = await tester(circuitPath)
        })

        it('Should unpack a field element with 4 packed values correctly', async () => {
            const elements: string[] = []
            for (let i = 0; i < 4; i ++) {
                let e = (BigInt(genRandomSalt().toString()) % (BigInt(2 ** 50))).toString(2)
                while (e.length < 50) {
                    e = '0' + e
                }
                elements.push(e)
            }
    
            const circuitInputs = stringifyBigInts({
                'in': BigInt('0b' + elements.join(''))
            })
    
            const witness = await circuit.calculateWitness(circuitInputs)
            await circuit.checkConstraints(witness)
            
            for (let i = 0; i < 4; i ++) {
                const out = await getSignal(circuit, witness, `out[${i}]`)
                expect(BigInt('0b' + BigInt(out).toString(2)).toString())
                    .to.be.eq(BigInt('0b' + elements[i]).toString())
            }
        })
    })
})
