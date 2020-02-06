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
})
