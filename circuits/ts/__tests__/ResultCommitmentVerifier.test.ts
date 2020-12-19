jest.setTimeout(90000)
import {
    genRandomSalt,
    stringifyBigInts,
} from 'maci-crypto'

import { 
    genWitness,
    getSignalByName,
} from './utils'

import {
    genTallyResultCommitment,
} from 'maci-core'

const DEPTH = 2
const NUM_OPTIONS = 5 ** DEPTH

const randVal = () => {
    return BigInt(Math.floor(Math.random() * 1000000000).toString())
}

/*
 * A helper function to generate circuit inputs to the ResultCommitmentVerifier
 * circuit
 */
const genResultCommitmentVerifierCircuitInputs = (
    currentResults: BigInt[],
    newResults: BigInt[],
    currentResultsSalt: BigInt,
    newResultsSalt: BigInt,
) => {

    const currentResultsCommitment = genTallyResultCommitment(
        currentResults,
        currentResultsSalt,
        DEPTH,
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
    const circuit = 'resultCommitmentVerifier_test'

    it('should correctly verify the hashes of a set of inputs and results', async () => {

        const currentResultsSalt = genRandomSalt()
        const newResultsSalt = genRandomSalt()

        const currentResults: BigInt[] = []
        const newResults: BigInt[] = []

        for (let i = 0; i < NUM_OPTIONS; i ++) {
            currentResults.push(randVal())
            newResults.push(randVal())
        }

        const newResultsCommitment = genTallyResultCommitment(newResults, newResultsSalt, DEPTH)

        const circuitInputs = stringifyBigInts(genResultCommitmentVerifierCircuitInputs(
            currentResults,
            newResults,
            currentResultsSalt,
            newResultsSalt,
        ))

        const witness = await genWitness(circuit, circuitInputs)
        const result = await getSignalByName(circuit, witness, 'main.newResultsCommitment')
        expect(result.toString()).toEqual(newResultsCommitment.toString())
    })
})
