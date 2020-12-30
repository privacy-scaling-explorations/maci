import { 
    genWitness,
    getSignalByName,
} from './utils'

import { 
    stringifyBigInts,
    IncrementalQuinTree,
} from 'maci-crypto'

const LEVELS = 4
const SUBTREE_LEVELS = 2

describe('QuinBatchLeavesExists circuit', () => {
    const circuit = 'quinBatchLeavesExists_test'
    let circuitInputs

    beforeAll(async () => {
        const tree = new IncrementalQuinTree(LEVELS, 0)
        const subTree = new IncrementalQuinTree(SUBTREE_LEVELS, 0)
        for (let i = 0; i < 5 ** LEVELS; i++) {
            tree.insert(BigInt(i))
        }

        for (let i = 0; i < 5 ** SUBTREE_LEVELS; i++) {
            subTree.insert(BigInt(i))
        }

        const path = tree.genMerkleSubrootPath(0, 25)

        expect(IncrementalQuinTree.verifyMerklePath(path, tree.hashFunc))
            .toBeTruthy()

        circuitInputs = stringifyBigInts({
            root: tree.root,
            leaves: subTree.leaves.slice(0, 25),
            path_elements: path.pathElements,
            path_index: path.indices,
        })
    })

    it('should test if a batch of leaves exists in a tree', async () => {
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
    })

    it('an invalid path should cause an error', async () => {
        expect.assertions(1)
        try {
            circuitInputs.root = '0'
            await genWitness(circuit, circuitInputs)
        } catch {
            expect(true).toBeTruthy()
        }
    })
})
