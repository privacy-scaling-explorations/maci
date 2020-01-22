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
    public leaves: any[] = []
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
            0: zeroValue
        }

        this.filledSubtrees = {
            0: zeroValue
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
        tree.leaves = this.leaves
        tree.leavesRaw = this.leavesRaw
        tree.leafNumber = this.leafNumber
        tree.zeros = this.zeros
        tree.filledSubtrees = this.filledSubtrees
        tree.filledPaths = this.filledPaths
        tree.root = this.root
        tree.nextIndex = this.nextIndex

        return tree
    }

    public hash (values: any[]): SnarkBigInt {
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
    public insert (leaf: SnarkBigInt, rawValue?: any) {
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
    public update (
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

        this._update(
            leafIndex,
            leaf,
            rawValue,
            path
        )
    }

    /*  _Verbose_ API to update the value of the leaf in the current tree.
     *  The reason why its so verbose is because I wanted to maintain compatibility
     *  with the merkletree smart contract obtained from semaphore.
     *  (https://github.com/kobigurk/semaphore/blob/2933bce0e41c6d4df82b444b66b4e84793c90893/semaphorejs/contracts/MerkleTreeLib.sol)
     *  It is also very expensive to update if we do it naively on the EVM
     */
    private _update (
        leafIndex: number,
        leaf: SnarkBigInt,
        rawValue: object,
        path: SnarkBigInt[],
    ) {
        if (leafIndex >= this.nextIndex) {
            throw new Error("Can't update leafIndex which hasn't been inserted yet!")
        }

        let curIdx = leafIndex
        let currentLevelHash = this.leaves[leafIndex]
        let left
        let right

        for (let i = 0; i < this.depth; i++) {
            if (curIdx % 2 === 0) {
                left = currentLevelHash
                right = path[i]
            } else {
                left = path[i]
                right = currentLevelHash
            }

            currentLevelHash = this.hashLeftRight(left, right)
            curIdx = Math.floor(curIdx / 2)
        }

        if (this.root !== currentLevelHash) {
            throw new Error('MerkleTree: tree root / current level has mismatch')
        }

        curIdx = leafIndex
        currentLevelHash = leaf

        for (let i = 0; i < this.depth; i++) {
            if (curIdx % 2 === 0) {
                left = currentLevelHash
                right = path[i]

                this.filledPaths[i][curIdx] = left
                this.filledPaths[i][curIdx + 1] = right
            } else {
                left = path[i]
                right = currentLevelHash

                this.filledPaths[i][curIdx - 1] = left
                this.filledPaths[i][curIdx] = right
            }

            currentLevelHash = this.hashLeftRight(left, right)
            curIdx = Math.floor(curIdx / 2)
        }

        this.root = currentLevelHash
        this.leaves[leafIndex] = leaf
        this.leavesRaw[leafIndex] = rawValue || {}
    }

    /*  Gets the path needed to construct a the tree root
     *  Used for quick verification on updates.
     *  Runs in O(log(N)), where N is the number of leaves
     */
    getPathUpdate (_leafIndex: number | SnarkBigInt): [SnarkBigInt[], number[]] {

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
