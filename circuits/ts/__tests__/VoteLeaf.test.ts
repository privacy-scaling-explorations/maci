import {
    compileAndLoadCircuit,
} from '../'

import {
    VoteLeaf,
} from 'maci-domainobjs'

import {
    bigInt,
} from 'maci-crypto'

describe('Vote leaf circuits', () => {
    let circuit

    it('correctly unpacks a vote leaf', async () => {
        circuit = await compileAndLoadCircuit('test/unpackVoteLeaf_test.circom')

        const pos = bigInt(1234)
        const neg = bigInt(4567)
        const voteLeaf = new VoteLeaf(pos, neg)

        const circuitInputs = {
            packedLeaf: voteLeaf.pack(),
        }

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const outputPos = witness[circuit.getSignalIdx('main.pos')].toString()
        const outputNeg = witness[circuit.getSignalIdx('main.neg')].toString()
        expect(outputPos).toEqual(pos.toString())
        expect(outputNeg).toEqual(neg.toString())
    })

    it('correctly calculates the square of voice credits spent in a vote leaf', async () => {
        circuit = await compileAndLoadCircuit('test/calculateSquaredVoteLeaf_test.circom')
        const pos = bigInt(1234)
        const neg = bigInt(4567)
        const voteLeaf = new VoteLeaf(pos, neg)

        const circuitInputs = {
            packedLeaf: voteLeaf.pack(),
        }

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const output = witness[circuit.getSignalIdx('main.squared')].toString()
        expect(output).toEqual((pos + neg).pow(bigInt(2)).toString())
    })
})
