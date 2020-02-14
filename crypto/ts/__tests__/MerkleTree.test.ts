import * as ethers from 'ethers'
import {
    MerkleTree,
    setupTree,
    bigInt,
    genRandomSalt,
    SnarkBigInt,
    hashLeftRight,
    NOTHING_UP_MY_SLEEVE,
} from '../'

const ZERO_VALUE = 0
const DEPTH = 2

/*
 * Calculate a Merkle root given a list of leaves
 */
const calculateRoot = (
    leaves: SnarkBigInt[],
): SnarkBigInt => {
    const totalLeaves = 2 ** DEPTH
    const numLeafHashers = totalLeaves / 2
    const numIntermediateHashers = numLeafHashers - 1

    const hashes: SnarkBigInt[] = []

    for (let i=0; i < numLeafHashers; i++) {
        hashes.push(hashLeftRight(leaves[i * 2], leaves[i * 2 + 1]))
    }

    let k = 0
    for (let i = numLeafHashers; i < numLeafHashers + numIntermediateHashers; i++) {
        hashes.push(
            hashLeftRight(hashes[k * 2], hashes[k * 2 + 1])
        )
        k ++
    }

    return hashes[hashes.length - 1]
}

describe('Merkle Tree', () => {

    const tree = setupTree(2, ZERO_VALUE)

    it('Should calculate the correct root', () => {
        const leaves: SnarkBigInt[] = []
        for (let i = 0; i < 2 ** DEPTH; i ++) {
            const leaf = genRandomSalt()
            leaves.push(leaf)
            tree.insert(leaf)
        }

        expect(calculateRoot(leaves)).toEqual(tree.root)
    })

    it('an updated tree should have the same root as another tree with the same leaves', () => {
        const tree1 = setupTree(2, ZERO_VALUE)
        const tree2 = setupTree(2, ZERO_VALUE)

        for (let i = 0; i < 4; i++) {
            tree1.insert(i + 1)
            tree2.insert(i + 1)
        }

        expect(tree1.root).toEqual(tree2.root)

        // Update the first tree at index 1
        const indexToUpdate = 1
        const newVal = 9
        tree1.update(indexToUpdate, newVal)
    
        // The roots must not match
        expect(tree1.root).not.toEqual(tree2.root)

        const tree3 = setupTree(2, ZERO_VALUE)
        for (let leaf of tree1.leaves) {
            tree3.insert(leaf)
        }
        expect(tree1.root).toEqual(tree3.root)
        expect(tree3.leaves[indexToUpdate]).toEqual(newVal)
    })

    it('copy() should produce a different object with the same attributes', () => {
        const copiedTree = tree.copy()

        expect(tree === tree).toBeTruthy()
        expect(tree === copiedTree).toBeFalsy()
        expect(tree.depth).toEqual(copiedTree.depth)
        expect(tree.zeroValue).toEqual(copiedTree.zeroValue)
        expect(tree.leaves).toEqual(copiedTree.leaves)
        expect(tree.leavesRaw).toEqual(copiedTree.leavesRaw)
        expect(tree.leafNumber).toEqual(copiedTree.leafNumber)
        expect(tree.zeros).toEqual(copiedTree.zeros)
        expect(tree.filledSubtrees).toEqual(copiedTree.filledSubtrees)
        expect(tree.filledPaths).toEqual(copiedTree.filledPaths)
        expect(tree.root).toEqual(copiedTree.root)
        expect(tree.nextIndex).toEqual(copiedTree.nextIndex)
    })

    it('intermediate tree generation', () => {
        const leaves = [
            bigInt('1'),
            bigInt('8'), 
            bigInt('7'), 
            bigInt('7'),
        ]
        const largeTree = setupTree(4, 0)
        const subTree = setupTree(2, 0)

        const b = subTree.root

        largeTree.insert(leaves[0])
        largeTree.insert(10)
        largeTree.update(1, leaves[1])
        largeTree.insert(leaves[2])
        largeTree.insert(leaves[3])

        for (let leaf of leaves) {
            subTree.insert(leaf)
        }

        const agg = setupTree(2, 0)
        agg.insert(subTree.root)
        agg.insert(b)
        agg.insert(b)
        agg.insert(b)

        expect(agg.root.toString()).toEqual(largeTree.root.toString())
    })
})
