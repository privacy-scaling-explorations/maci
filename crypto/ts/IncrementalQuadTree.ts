import * as assert from 'assert'
import {
    SnarkBigInt,
    hashLeftRight,
    hash5,
    bigInt,
    stringifyBigInts,
    unstringifyBigInts,
} from './'

type Leaf = SnarkBigInt
type Root = SnarkBigInt
type PathElements = SnarkBigInt[]
type Indices = SnarkBigInt[]

interface MerkleProof {
    pathElements: PathElements;
    indices: Indices;
}

const deepCopyBigIntArray = (arr: SnarkBigInt[]) => {
    return arr.map((x) => bigInt(x.toString()))
}

/* 
 * An incremental Merkle tree which conforms to the implementation in
 * IncrementalQuadTree.sol. It supports 2 - 5 elements per leaf.
 */
class IncrementalQuadTree {
    // The number of leaves per node
    public leavesPerNode: SnarkBigInt

    // The tree depth
    public depth: number

    // The default value for empty leaves
    public zeroValue: SnarkBigInt

    // The tree root
    public root: SnarkBigInt

    // The the smallest empty leaf index
    public nextIndex: SnarkBigInt

    // All leaves in the tree
    public leaves: Leaf[] = []

    // Contains the zero value per level. i.e. zeros[0] is zeroValue,
    // zeros[1] is the hash of leavesPerNode zeros, and so on.
    public zeros: SnarkBigInt[] = []

    // Caches values needed for efficient appends.
    public filledSubtrees: SnarkBigInt[][] = []

    // Caches values needed to compute Merkle paths.
    public filledPaths: any = {}

    // The hash function to use
    public hashFunc: (leaves: SnarkBigInt[]) => SnarkBigInt

    private MAX_LEAVES_PER_NODE = 5

    constructor (
        _depth: number,
        _zeroValue: SnarkBigInt,
        _leavesPerNode: number | SnarkBigInt = 5,
    ) {
        // This class supports a maximum of 5 leaves per node, as this is the
        // largest number of inputs which circomlib's Poseidon EVM hash
        // function implementation provides for.
        assert(_leavesPerNode <= this.MAX_LEAVES_PER_NODE)

        this.leavesPerNode = bigInt(_leavesPerNode)
        this.depth = _depth
        this.nextIndex = bigInt(0)
        this.zeroValue = _zeroValue

        // Set this.hashFunc depending on the number of leaves per node
        if (this.leavesPerNode === 2) {
            // Uses PoseidonT3 under the hood, which accepts 2 inputs
            this.hashFunc = (inputs: SnarkBigInt[]) => {
                return hashLeftRight(inputs[0], inputs[1])
            }
        } else {
            // Uses PoseidonT6 under the hood, which accepts up to 5 inputs
            this.hashFunc = hash5
        }

        this.zeros = [this.zeroValue]
        this.filledSubtrees = []

        // Calculate intermediate values
        for (let i = 1; i < _depth; i++) {
            const z: SnarkBigInt[] = []
            for (let j = 0; j < this.MAX_LEAVES_PER_NODE; j ++) {
                z.push(this.zeros[i - 1])
            }
            const h = this.hash(z)
            this.zeros.push(h)
            this.filledSubtrees.push(z)
            this.filledPaths[i - 1] = []
        }

        // Calculate the root
        const r: SnarkBigInt[] = []
        for (let i = 0; i < this.MAX_LEAVES_PER_NODE; i ++) {
            r.push(this.zeros[this.zeros.length - 1])
        }
        this.filledSubtrees.push(r)

        // Assign the root
        this.root = this.hash(r)
    }

    /* 
     * Insert a leaf into the Merkle tree
     * @param _value The value to insert. This may or may not already be
     *               hashed.
     */
    public insert(
        _value: Leaf,
    ) {
        // Ensure that _value is a SnarkBigInt
        _value = bigInt(_value)

        // A node is one level above the leaf
        // m is the leaf's relative position within its node
        let m = this.nextIndex % this.leavesPerNode

        // Zero out the level in filledSubtrees
        if (m === bigInt(0)) {
            for (let j = 1; j < this.leavesPerNode; j ++) {
                this.filledSubtrees[0][j] = this.zeros[0]
            }
        }

        this.filledSubtrees[0][m] = _value

        let currentIndex: SnarkBigInt = this.nextIndex
        for (let i = 1; i < this.depth; i++) {
            // currentIndex is the leaf or node's absolute index
            currentIndex /= this.leavesPerNode

            // m is the leaf's relative position within its node
            m = currentIndex % this.leavesPerNode

            // Zero out the level
            if (m === bigInt(0)) {
                for (let j = 1; j < this.leavesPerNode; j ++) {
                    this.filledSubtrees[i][j] = this.zeros[i]
                }
            }

            const hashed = this.hash(this.filledSubtrees[i - 1])
            this.filledSubtrees[i][m] = hashed

            if (this.filledPaths[i - 1].length <= currentIndex) {
                this.filledPaths[i - 1].push(hashed)
            } else {
                this.filledPaths[i - 1][currentIndex] = hashed
            }
        }

        this.leaves.push(_value)
        this.nextIndex += bigInt(1)
        this.root = this.hash(
            this.filledSubtrees[this.filledSubtrees.length - 1],
        )
    }

    /* 
     * Update the leaf at the specified index with the given value.
     */
    public update(
        _index: number,
        _value: Leaf,
    ) {
        if (_index >= this.nextIndex || _index >= this.leaves.length) {
            throw new Error('The leaf index specified is too large')
        }

        _value = bigInt(_value)

        const temp = this.leaves
        temp[_index] = _value

        this.leaves[_index] = _value

        const newTree = new IncrementalQuadTree(
            this.depth,
            this.zeroValue,
            this.leavesPerNode,
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
    public getLeaf(_index: number): Leaf {
        return this.leaves[_index]
    }

    /*  Generates a Merkle proof from a leaf to the root.
     */
    public genMerklePath(_index: number): MerkleProof {
        if (_index < 0) {
            throw new Error('The leaf index must be greater than 0')
        }
        if (_index >= this.nextIndex || _index >= this.leaves.length) {
            throw new Error('The leaf index is too large')
        }

        const pathElements: SnarkBigInt[][] = []
        const indices: SnarkBigInt[] = []

        let r = bigInt(_index).div(this.leavesPerNode)

        for (let i = 0; i < this.depth; i ++) {
            const s: SnarkBigInt[] = []
            if (i === 0) {
                // Get a slice of leaves, padded with zeros
                const leafStartIndex = bigInt(_index) - (bigInt(_index) % this.leavesPerNode)
                const leafEndIndex = leafStartIndex + this.leavesPerNode
                for (let j = leafStartIndex; j < leafEndIndex; j ++) {
                    if (j < this.leaves.length) {
                        s.push(this.leaves[j])
                    } else {
                        s.push(this.zeros[i])
                    }
                }
            } else {
                for (let j = 0; j < this.leavesPerNode; j ++) {
                    const x = r.mul(this.leavesPerNode) + bigInt(j)
                    if (this.filledPaths[i - 1].length <= x) {
                        s.push(this.zeros[i])
                    } else {
                        const e = this.filledPaths[i - 1][x]
                        s.push(e)
                    }
                }
            }

            pathElements.push(s)
            indices.push(r % this.leavesPerNode)

            r = r.div(this.leavesPerNode)
        }

        return { pathElements, indices }
    }

    public static verifyMerklePath(
        _proof: MerkleProof,
        _hashFunc: (leaves: SnarkBigInt[]) => SnarkBigInt,
        _depth: number,
        _root: SnarkBigInt,
    ): boolean {
        // Validate the proof format
        assert (_proof.pathElements)
        assert (_proof.indices)
        for (let i = 0; i < _depth; i ++) {
            assert(_proof.pathElements[i])
            assert(_proof.indices[i] != undefined)
        }

        // Verify the proof
        for (let i = 1; i < _depth; i ++) {
            const v = _hashFunc(_proof.pathElements[i-1])
                .equals(_proof.pathElements[i][_proof.indices[i - 1]])

            if (!v) {
                return false
            }
        }

        // Verify the root
        return _hashFunc(_proof.pathElements[_depth - 1]).equals(_root)
    }

    /*  Deep-copies this object
     */
    public copy(): IncrementalQuadTree {
        const newTree = new IncrementalQuadTree(
            this.depth,
            this.zeroValue,
            this.leavesPerNode,
        )
        newTree.leaves = deepCopyBigIntArray(this.leaves)
        newTree.zeros = deepCopyBigIntArray(this.zeros)
        newTree.root = this.root
        newTree.nextIndex = this.nextIndex
        newTree.filledSubtrees = this.filledSubtrees.map(deepCopyBigIntArray)
        newTree.filledPaths = unstringifyBigInts(JSON.parse(
            JSON.stringify(stringifyBigInts(this.filledPaths))
        ))

        return newTree
    }

    private hash(_leaves: SnarkBigInt[]): SnarkBigInt  {
        return this.hashFunc(_leaves)
    }
}

export {
    IncrementalQuadTree,
}
