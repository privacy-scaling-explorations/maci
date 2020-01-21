import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import { 
    setupTree,
    bigInt,
    hashOne,
} from 'maci-crypto'

describe('Decryption circuit', () => {
    let circuit 
    beforeAll(async () => {
        // Compile circuit
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/merkleTreeLeafExists_test.circom'))
        circuit = new Circuit(circuitDef)
    })

    it('should verify a Merkle proof inside the snark', async () => {
        const tree = setupTree(2, 0)
        const leaf = hashOne(bigInt(1))
        tree.insert(leaf)
        tree.insert(hashOne(bigInt(0)))
        tree.insert(hashOne(bigInt(0)))
        tree.insert(hashOne(bigInt(0)))

        const proof = tree.getPathUpdate(0)

        const circuitInputs = {
            leaf,
            path_elements: proof[0],
            path_index: proof[1],
            root: tree.root,
        }

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()
    })
})
