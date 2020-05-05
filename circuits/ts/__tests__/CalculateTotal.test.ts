import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')
import {
    setupTree,
    genRandomSalt,
    Plaintext,
    bigInt,
    hashOne,
    hash,
    SnarkBigInt,
} from 'maci-crypto'

import {
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

import {
    compileAndLoadCircuit,
} from '../'

import {
    genPublicSignals,
} from 'libsemaphore'

const ZERO_VALUE = 0

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
