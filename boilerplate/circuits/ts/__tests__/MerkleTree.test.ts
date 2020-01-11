import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')
import {
    setupTree,
    hashOne,
    SnarkBigInt,
    bigInt,
} from 'maci-crypto'

const LEVELS = 4
describe('Merkle Tree circuits', () => {
    describe('LeafExists', () => {
        let circuit

        beforeAll(async () => {
            const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/merkleTreeLeafExists_test.circom'))
            circuit = new Circuit(circuitDef)
        })

        it('Valid LeafExists inputs should work', async () => {
            const tree = setupTree(LEVELS)
            let leaves: SnarkBigInt[] = []

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                await tree.update(i, leaf)
                leaves.push(leaf)
            }

            const root = await tree.root()

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const proof = await tree.path(i)
                const circuitInputs = {
                    leaf: leaves[i],
                    path_elements: proof.path_elements,
                    path_index: proof.path_index,
                    root,
                }
                const witness = circuit.calculateWitness(circuitInputs)
                expect(circuit.checkWitness(witness)).toBeTruthy()
            }
        })

        it('Invalid LeafExists inputs should not work', async () => {
            const tree = setupTree(LEVELS)
            let leaves: SnarkBigInt[] = []

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                await tree.update(i, leaf)
                leaves.push(leaf)
            }

            const root = await tree.root()

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const proof = await tree.path(i)
                const circuitInputs = {
                    leaf: leaves[i],
                    // The following are swapped to delibrately create an error
                    path_elements: proof.path_index,
                    path_index: proof.path_elements,
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
            const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/merkleTreeCheckRoot_test.circom'))
            circuit = new Circuit(circuitDef)
        })

        it('Valid CheckRoot inputs should work', async () => {
            const tree = setupTree(LEVELS)
            let leaves: SnarkBigInt[] = []

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                await tree.update(i, leaf)
                leaves.push(leaf)
            }

            const root = await tree.root()

            const circuitInputs = { leaves }

            const witness = circuit.calculateWitness(circuitInputs)
            expect(witness[circuit.getSignalIdx('main.root')].toString())
                .toEqual(root.toString())
            expect(circuit.checkWitness(witness)).toBeTruthy()

            // TODO: generate proof and verify
        })

        it('Different leaves should generate a different root', async () => {
            const tree = setupTree(LEVELS)
            let leaves: SnarkBigInt[] = []
            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                await tree.update(i, leaf)

                // Give the circuit a different leaf
                leaves.push(bigInt(randomVal + 1))
            }

            const root = await tree.root()
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
            const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/merkleTreeUpdate_test.circom'))
            circuit = new Circuit(circuitDef)
        })

        it('Valid update proofs should work', async () => {
            const tree = setupTree(LEVELS)

            let leaves: SnarkBigInt[] = []
            // Populate the tree
            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                await tree.update(i, leaf)

            }

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal).toString()

                await tree.update(i, leaf)

                const proof = await tree.path(i)

                const root = await tree.root()

                const circuitInputs = {
                    leaf: leaf.toString(),
                    path_elements: proof.path_elements,
                    path_index: proof.path_index,
                }

                const witness = circuit.calculateWitness(circuitInputs)
                expect(witness[circuit.getSignalIdx('main.root')].toString())
                    .toEqual(root.toString())
                expect(circuit.checkWitness(witness)).toBeTruthy()

                // TODO: generate proof and verify
            }
        })

        it('Invalid update proofs should not work', async () => {
            const tree = setupTree(LEVELS)

            // Populate the tree
            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal)
                await tree.update(i, leaf)
            }

            for (let i = 0; i < 2 ** LEVELS; i++) {
                const randomVal = Math.floor(Math.random() * 1000)
                const leaf = hashOne(randomVal).toString()

                await tree.update(i, leaf)

                const proof = await tree.path(i)

                const root = await tree.root()

                const circuitInputs = {
                    leaf: leaf.toString(),
                    // The following are swapped to delibrately create an error
                    path_elements: proof.path_index,
                    path_index: proof.path_elements,
                }

                expect(() => {
                    circuit.calculateWitness(circuitInputs)
                }).toThrow()
            }
        })
    })
})
