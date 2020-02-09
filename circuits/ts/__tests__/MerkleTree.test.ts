import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import {
    compileAndLoadCircuit,
} from '../'

import {
    setupTree,
    hashOne,
    SnarkBigInt,
    bigInt,
} from 'maci-crypto'

const LEVELS = 4
const ZERO_VALUE = 0

describe('Merkle Tree circuits', () => {
    describe('LeafExists', () => {
        let circuit

        beforeAll(async () => {
            circuit = await compileAndLoadCircuit('merkleTreeLeafExists_test.circom')
        })

        it('Valid LeafExists inputs should work', async () => {
            const tree = setupTree(LEVELS, ZERO_VALUE)
            let leaves: SnarkBigInt[] = []

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                tree.insert(leaf)
                leaves.push(leaf)
            }

            const root = tree.root

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const proof = tree.getPathUpdate(i)
                const circuitInputs = {
                    leaf: leaves[i],
                    path_elements: proof[0],
                    path_index: proof[1],
                    root,
                }
                const witness = circuit.calculateWitness(circuitInputs)
                expect(circuit.checkWitness(witness)).toBeTruthy()
            }
        })

        it('Invalid LeafExists inputs should not work', async () => {
            const tree = setupTree(LEVELS, ZERO_VALUE)
            let leaves: SnarkBigInt[] = []

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                tree.insert(leaf)
                leaves.push(leaf)
            }

            const root = tree.root

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const proof = tree.getPathUpdate(i)
                const circuitInputs = {
                    leaf: leaves[i],
                    // The following are swapped to delibrately create an error
                    path_elements: proof[1],
                    path_index: proof[0],
                    root,
                }
                expect(() => {
                    circuit.calculateWitness(circuitInputs)
                }).toThrow()
            }
        })
    })

    describe('CheckRoot', () => {
        let circuit

        beforeAll(async () => {
            circuit = await compileAndLoadCircuit('merkleTreeCheckRoot_test.circom')
        })

        it('Valid CheckRoot inputs should work', async () => {
            const tree = setupTree(LEVELS, ZERO_VALUE)
            let leaves: SnarkBigInt[] = []

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                tree.insert(leaf)
                leaves.push(leaf)
            }

            const root = tree.root

            const circuitInputs = { leaves }

            const witness = circuit.calculateWitness(circuitInputs)
            expect(witness[circuit.getSignalIdx('main.root')].toString())
                .toEqual(root.toString())
            expect(circuit.checkWitness(witness)).toBeTruthy()

            // TODO: generate proof and verify
        })

        it('Different leaves should generate a different root', async () => {
            const tree = setupTree(LEVELS, ZERO_VALUE)
            let leaves: SnarkBigInt[] = []
            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                tree.insert(leaf)

                // Give the circuit a different leaf
                leaves.push(bigInt(randomVal + 1))
            }

            const root = tree.root
            const circuitInputs = { leaves }
            const witness = circuit.calculateWitness(circuitInputs)
            expect(witness[circuit.getSignalIdx('main.root')].toString())
                .not.toEqual(root.toString())
            expect(circuit.checkWitness(witness)).toBeTruthy()
        })
    })

    describe('MerkleTreeUpdate', () => {
        let circuit

        beforeAll(async () => {
            circuit = await compileAndLoadCircuit('merkleTreeUpdate_test.circom')
        })

        it('Valid update proofs should work', async () => {
            const tree = setupTree(LEVELS, ZERO_VALUE)

            let leaves: SnarkBigInt[] = []
            // Populate the tree
            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                tree.insert(leaf)
            }

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal).toString()

                tree.update(i, leaf)

                const proof = tree.getPathUpdate(i)

                const root = tree.root

                const circuitInputs = {
                    leaf: leaf.toString(),
                    path_elements: proof[0],
                    path_index: proof[1],
                }

                const witness = circuit.calculateWitness(circuitInputs)
                expect(witness[circuit.getSignalIdx('main.root')].toString())
                    .toEqual(root.toString())
                expect(circuit.checkWitness(witness)).toBeTruthy()
            }
        })

        it('Invalid update proofs should not work', async () => {
            const tree = setupTree(LEVELS, ZERO_VALUE)

            // Populate the tree
            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                tree.insert(leaf)
            }

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal).toString()

                tree.insert(leaf)

                const proof = tree.getPathUpdate(i)

                const root = tree.root

                const circuitInputs = {
                    leaf: leaf.toString(),
                    // The following are swapped to delibrately create an error
                    path_elements: proof[1],
                    path_index: proof[0],
                }

                expect(() => {
                    circuit.calculateWitness(circuitInputs)
                }).toThrow()
            }
        })
    })
})
