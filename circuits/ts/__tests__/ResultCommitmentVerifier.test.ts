import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')
import {
    genRandomSalt,
    bigInt,
    hash,
    stringifyBigInts,
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
    genTallyResultCommitment,
} from 'maci-core'

import {
    genPublicSignals,
} from 'libsemaphore'

const NUM_OPTIONS = 4

const randVal = () => {
    return bigInt(Math.floor(Math.random() * 1000000000).toString())
}

/*
 * A helper function to generate circuit inputs to the ResultCommitmentVerifier
 * circuit
 */
const genResultCommitmentVerifierCircuitInputs = (
    currentResults: SnarkBigInt[],
    newResults: SnarkBigInt[],
    currentResultsSalt: SnarkBigInt,
    newResultsSalt: SnarkBigInt,
) => {

    const currentResultsCommitment = genTallyResultCommitment(
        currentResults,
        currentResultsSalt,
    )

    const newResultsCommitment = genTallyResultCommitment(
        newResults,
        newResultsSalt,
    )

    return {
        currentResultsSalt,
        currentResultsCommitment,
        currentResults,
        newResultsSalt,
        newResults,
    }
}

describe('ResultCommitmentVerifier circuit', () => {
    let circuit 

    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('test/resultCommitmentVerifier_test.circom')
    })

    it('should correctly verify the hashes of a set of inputs and results', async () => {

        const currentResultsSalt = genRandomSalt()
        const newResultsSalt = genRandomSalt()

        let currentResults: SnarkBigInt[] = []
        let newResults: SnarkBigInt[] = []

        for (let i = 0; i < NUM_OPTIONS; i ++) {
            currentResults.push(randVal())
            newResults.push(randVal())
        }

        const newResultsCommitment = genTallyResultCommitment(newResults, newResultsSalt)

        const circuitInputs = genResultCommitmentVerifierCircuitInputs(
            currentResults,
            newResults,
            currentResultsSalt,
            newResultsSalt,
        )

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()
        const resultIdx = circuit.getSignalIdx('main.newResultsCommitment')
        const result = witness[resultIdx]
        expect(result.toString()).toEqual(newResultsCommitment.toString())
    })
})
