import * as assert from 'assert'
import {
    SnarkBigInt,
    hashLeftRight,
    hash5,
    bigInt,
} from './'

type Leaf = SnarkBigInt
type Root = SnarkBigInt
type PathElements = SnarkBigInt[]
type Indices = SnarkBigInt[]

interface MerkleProof {
    pathElements: PathElements;
    indices: Indices;
}

/* 
 * An incremental Merkle tree which conforms to the implementation in
 * IncrementalQuadTree.sol. It supports 2 - 5 elements per leaf.
 */
class IncrementalQuadTree {
    // The number of leaves per node
    public leavesPerNode: number

    // The tree depth
    public depth: number

    // The default value for empty leaves
    public zeroValue: SnarkBigInt

    // The tree root
    public root: SnarkBigInt

    // The the smallest empty leaf index
    public nextIndex: number

    // All leaves in the tree
    public leaves: Leaf[] = []

    // Cached values required to compute Merkle proofs
    public zeros: any
    public filledSubtrees: any = {}
    public filledPaths: any = {}
    public hashFunc: (leaves: SnarkBigInt[]) => SnarkBigInt

    private MAX_LEAVES_PER_NODE = bigInt(5)

    constructor (
        _depth: number,
        _zeroValue: SnarkBigInt,
        _leavesPerNode: number,
    ) {
        // This class supports a maximum of 5 leaves per node, as this is the
        // largest number of inputs which circomlib's Poseidon EVM hash
        // function implementation provides for.
        assert(_leavesPerNode <= this.MAX_LEAVES_PER_NODE)

        this.leavesPerNode = _leavesPerNode

        if (this.leavesPerNode === 2) {
            // Uses PoseidonT3 under the hood, which accepts 2 inputs
            this.hashFunc = (inputs: SnarkBigInt[]) => {
                return hashLeftRight(inputs[0], inputs[1])
            }
        } else {
            // Uses PoseidonT6 under the hood, which accepts up to 5 inputs
            this.hashFunc = hash5
        }

        this.depth = _depth
        this.nextIndex = 0
        this.zeroValue = _zeroValue
        this.zeros = [this.zeroValue]

        // Calculate intermediate values
        for (let i = 1; i < _depth; i++) {
            const z: SnarkBigInt[] = []
            for (let j = 0; j < this.MAX_LEAVES_PER_NODE; j ++) {
                z.push(this.zeros[i-1])
            }
            this.zeros.push(this.hashFunc(z))
            this.filledSubtrees[i] = this.zeros[i]
            this.filledPaths[i] = {}
        }

        // Calculate the root
        const r: SnarkBigInt[] = []
        for (let i = 0; i < this.MAX_LEAVES_PER_NODE; i ++) {
            r.push(this.zeros[this.depth - 1])
        }

        // Assign the root
        this.root = this.hashFunc(r)
    }

    /* 
     * Insert a leaf into the Merkle tree
     * @param _value The value to insert. This may or may not already be
     *               hashed.
     */
    public insert(
        _value: Leaf,
    ) {
        _value = bigInt(_value)

        // 
    }
    /* 
     * Update the leaf at the specified index with the given value.
     * TODO
     */
    //public update(
        //_index: number,
        //_value: Leaf,
    //) {
    //}

    /*
     * Returns the leaf value at the given index
     */
    public getLeaf(_leafIndex: number): Leaf {
        return this.leaves[_leafIndex]
    }

    /*  Generates a Merkle proof from a leaf to the root.
     *  TODO
     */

    //public genMerklePath(_leafIndex: number): MerkleProof {
    //}

    /*  Deep-copies this object
     *  TODO
     */
    //public copy(): IncrementalQuadTree {
    //}

}

export {
    IncrementalQuadTree,
}
