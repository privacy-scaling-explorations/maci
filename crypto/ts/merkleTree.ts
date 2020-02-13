import * as assert from 'assert'
import {
    SnarkBigInt,
    hashLeftRight,
    hash,
    bigInt,
} from './'

class MerkleTree {
    /*  Creates an optimized MerkleTree with `treeDepth` depth,
     *  of which are initialized with the initial value `zeroValue`.
     *
     *  i.e. the 0th level is initialized with `zeroValue`,
     *       and the 1st level is initialized with
     *       hashLeftRight(`zeroValue`, `zeroValue`)
     */
    public depth: number
    public zeroValue: SnarkBigInt
    public leaves: SnarkBigInt[] = []
    public leavesRaw: any[] = [] // Raw hash value of the leaves
    public leafNumber: number
    public zeros: any
    public filledSubtrees: any
    public filledPaths: any
    public root: SnarkBigInt
    public nextIndex: number

    constructor (depth: number, zeroValue: number) {
        this.depth = depth
        this.zeroValue = bigInt(zeroValue)
        this.leaves = [] // Hash value of the leaves
        this.leavesRaw = [] // Raw hash value of the leaves
        this.leafNumber = Math.pow(2, depth)

        this.zeros = {
            0: this.zeroValue
        }

        this.filledSubtrees = {
            0: this.zeroValue
        }

        this.filledPaths = {
            0: {}
        }

        for (let i = 1; i < depth; i++) {
            this.zeros[i] = this.hashLeftRight(this.zeros[i - 1], this.zeros[i - 1])
            this.filledSubtrees[i] = this.zeros[i]
            this.filledPaths[i] = {}
        }

        this.root = this.hashLeftRight(
            this.zeros[this.depth - 1],
            this.zeros[this.depth - 1]
        )

        this.nextIndex = 0
    }

    public copy(): MerkleTree {
        const tree = new MerkleTree(this.depth, this.zeroValue)
        for (let i = 0; i < this.leaves.length; i++) {
            tree.insert(this.leaves[i], this.leavesRaw[i])
        }

        assert(tree.root.equals(this.root))

        return tree
    }

    public hash(values: any[]): SnarkBigInt {
        if (Array.isArray(values)) {
            return hash(values.map((x: any): SnarkBigInt => bigInt(x)))
        }

        return hash(values)
    }

    /*  Helper function to hash the left and right values
     *  of the leaves
     */
    public hashLeftRight (left: SnarkBigInt, right: SnarkBigInt): SnarkBigInt {
        return hashLeftRight(left, right)
    }

    /* Inserts a new value into the merkle tree */
    public insert(leaf: SnarkBigInt, rawValue?: any) {
        let curIdx = this.nextIndex
        this.nextIndex += 1

        let currentLevelHash = leaf
        let left
        let right

        for (let i = 0; i < this.depth; i++) {
            if (curIdx % 2 === 0) {
                left = currentLevelHash
                right = this.zeros[i]

                this.filledSubtrees[i] = currentLevelHash

                this.filledPaths[i][curIdx] = left
                this.filledPaths[i][curIdx + 1] = right
            } else {
                left = this.filledSubtrees[i]
                right = currentLevelHash

                this.filledPaths[i][curIdx - 1] = left
                this.filledPaths[i][curIdx] = right
            }

            currentLevelHash = this.hashLeftRight(left, right)
            curIdx = Math.floor(curIdx / 2)
        }

        this.root = currentLevelHash
        this.leaves.push(leaf)

        if (rawValue === undefined) {
            this.leavesRaw.push(null)
        } else {
            this.leavesRaw.push(rawValue)
        }
    }

    /* Updates merkletree leaf at `leafIndex` with `newLeafValue` */
    public update(
        _leafIndex: number | SnarkBigInt,
        leaf: SnarkBigInt,
        rawValue?: any,
    ) {

        const leafIndex = parseInt(bigInt(_leafIndex).toString(), 10)

        if (leafIndex >= this.nextIndex) {
            throw new Error("Can't update leafIndex which hasn't been inserted yet!")
        }

        // eslint-disable-next-line no-unused-vars
        const [path, _] = this.getPathUpdate(leafIndex)

        this.leaves[leafIndex] = leaf
        this.leavesRaw[leafIndex] = rawValue || {} // or null?

        const newTree = new MerkleTree(this.depth, this.zeroValue)
        for (let i = 0; i < this.leaves.length; i++) {
            newTree.insert(this.leaves[i], this.leavesRaw[i])
        }
        
        this.leaves = newTree.leaves
        this.leavesRaw = newTree.leavesRaw
        this.leafNumber = newTree.leafNumber
        this.zeros = newTree.zeros
        this.filledSubtrees = newTree.filledSubtrees
        this.filledPaths = newTree.filledPaths
        this.root = newTree.root
        this.nextIndex = newTree.nextIndex
    }

    /*  Gets the path needed to construct a the tree root
     *  Used for quick verification on updates.
     *  Runs in O(log(N)), where N is the number of leaves
     */
    getPathUpdate(_leafIndex: number | SnarkBigInt): [SnarkBigInt[], number[]] {

        const leafIndex = parseInt(_leafIndex.toString(), 10)

        if (leafIndex >= this.nextIndex) {
            throw new Error('Path not constructed yet, leafIndex >= nextIndex')
        }

        let curIdx = leafIndex
        let path: any[] = []
        let pathIndex: any[] = []

        for (let i = 0; i < this.depth; i++) {
            if (curIdx % 2 === 0) {
                path.push(this.filledPaths[i][curIdx + 1])
                pathIndex.push(0)
            } else {
                path.push(this.filledPaths[i][curIdx - 1])
                pathIndex.push(1)
            }
            curIdx = Math.floor(curIdx / 2)
        }

        return [path, pathIndex]
    }

    /*  Gets the path needed to construct a the tree root
     *  Used for quick verification on inserts.
     *  Runs in O(log(N)), where N is the number of leaves
     */
    getPathInsert (): [SnarkBigInt[], SnarkBigInt[], SnarkBigInt[]] {
        let curIdx = this.nextIndex

        let pathIndex: SnarkBigInt[] = []

        for (let i = 0; i < this.depth; i++) {
            if (curIdx % 2 === 0) {
                pathIndex.push(bigInt(0))
            } else {
                pathIndex.push(bigInt(1))
            }
            curIdx = Math.floor(curIdx / 2)
        }

        return [
            this.zeros,
            this.filledSubtrees,
            pathIndex
        ]
    }
}

// Helper function to abstract away `new` keyword for API
const createMerkleTree = (
    treeDepth: number,
    zeroValue: number,
): MerkleTree => new MerkleTree(treeDepth, zeroValue)


export {
    createMerkleTree,
    MerkleTree
}
