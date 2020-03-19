import * as assert from 'assert'
import {
    SnarkBigInt,
    hashOne,
    hashLeftRight,
    bigInt,
    SNARK_FIELD_SIZE,
} from './'

/* 
 * An incremental Merkle tree which conforms to the implementation in
 * IncrementalMerkleTree.sol
 */
class IncrementalMerkleTree {
    // The tree depth
    public depth: number

    // The default value for empty leaves
    public zeroValue: SnarkBigInt

    // The tree root
    public root: SnarkBigInt

    // The the smallest empty leaf index
    public nextIndex: number

    public leaves: SnarkBigInt[] = []

    // Cached values required to compute Merkle proofs
    public zeros: any
    public filledSubtrees: any
    public filledPaths: any
    public hashLeftRight: (left: SnarkBigInt, right: SnarkBigInt) => SnarkBigInt

    constructor (
        _depth: number | SnarkBigInt,
        _zeroValue: SnarkBigInt,
        _hashLeftRight: (left: SnarkBigInt, right: SnarkBigInt) => SnarkBigInt = hashLeftRight,
    ) {
        this.depth = parseInt(_depth.toString(), 10)
        this.zeroValue = _zeroValue
        this.nextIndex = 0
        this.zeros = { 0: this.zeroValue }
        this.filledSubtrees = { 0: this.zeroValue }
        this.filledPaths = { 0: {} }
        this.hashLeftRight = _hashLeftRight

        // Compute and cache intermediate values required to compute Merkle
        // proofs
        for (let i = 1; i < _depth; i++) {
            this.zeros[i] = this.hashLeftRight(
                this.zeros[i - 1],
                this.zeros[i - 1],
            )
            this.filledSubtrees[i] = this.zeros[i]
            this.filledPaths[i] = {}
        }

        // Compute the Merkle root
        this.root = this.hashLeftRight(
            this.zeros[this.depth - 1],
            this.zeros[this.depth - 1],
        )
    }

    /* 
     * Insert a leaf into the Merkle tree
     * @param _value The value to insert. This may or may not already be
     *               hashed.
     */
    public insert(
        _value: any,
    ) {

        let curIdx = this.nextIndex
        this.nextIndex += 1

        let currentLevelHash = _value
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

            currentLevelHash = hashLeftRight(left, right)
            curIdx = Math.floor(curIdx / 2)
        }

        this.root = currentLevelHash
        this.leaves.push(_value)
    }

    /*
     * Deep-copy the Merkle tree
     */
    public copy(): IncrementalMerkleTree {
        const tree = new IncrementalMerkleTree(this.depth, this.zeroValue)

        for (let i = 0; i < this.leaves.length; i++) {
            tree.insert(this.leaves[i])
        }

        assert(this.root === tree.root)

        return tree
    }

    /* 
     * Update the leaf at the specified index with the given value.
     */
    public update(
        _leafIndex: number,
        _value: SnarkBigInt,
    ) {

        if (_leafIndex >= this.nextIndex) {
            throw new Error('The leaf index specified is too large')
        }

        let temp = this.leaves
        temp[_leafIndex] = _value

        const newTree = new IncrementalMerkleTree(
            this.depth,
            this.zeroValue,
        )

        for (let i = 0; i < temp.length; i++) {
            newTree.insert(temp[i])
        }
        
        this.leaves = newTree.leaves
        this.zeros = newTree.zeros
        this.filledSubtrees = newTree.filledSubtrees
        this.filledPaths = newTree.filledPaths
        this.root = newTree.root
        this.nextIndex = newTree.nextIndex
    }

    /*
     * Returns the leaf value at the given index
     */
    public getLeaf(_leafIndex: number | SnarkBigInt): SnarkBigInt {
        const leafIndex = parseInt(_leafIndex.toString(), 10)

        return this.leaves[leafIndex]
    }

    /*  Returns the path needed to construct a the tree root
     *  Used for quick verification on updates.
     *  Runs in O(log(N)), where N is the number of leaves
     */
    public getPathUpdate(_leafIndex: number | SnarkBigInt): [SnarkBigInt[], number[]] {

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
                pathIndex.push(bigInt(0))
            } else {
                path.push(this.filledPaths[i][curIdx - 1])
                pathIndex.push(bigInt(1))
            }
            curIdx = Math.floor(curIdx / 2)
        }

        return [path, pathIndex]
    }

    /*  Gets the path needed to construct a the tree root
     *  Used for quick verification on inserts.
     *  Runs in O(log(N)), where N is the number of leaves
     */
    public getPathInsert (): [SnarkBigInt[], SnarkBigInt[], SnarkBigInt[]] {
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

export {
    IncrementalMerkleTree
}
