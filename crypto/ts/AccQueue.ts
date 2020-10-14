import * as assert from 'assert'
import {
    hashLeftRight,
    hash5,
    stringifyBigInts,
    unstringifyBigInts,
    IncrementalQuinTree,
} from './'

type Leaf = BigInt
type Root = BigInt

const deepCopyBigIntArray = (arr: BigInt[]) => {
    return arr.map((x) => BigInt(x.toString()))
}

const calcDepthFromNumLeaves = (
    hashLength: number,
    numLeaves: number,
) => {
    let depth = 1
    while (true) {
        const max = hashLength ** depth
        if (BigInt(max) >= numLeaves) {
            break
        }
        depth ++
    }

    return depth
}

/*
 * An Accumulator Queue which conforms to the implementation in AccQueue.sol.
 * Each enqueue() operation updates a subtree, and a merge() operation combines
 * all subtrees into a main tree.
 * It supports 2 or 5 elements per leaf.
 */
class AccQueue {

    private MAX_DEPTH = 32

    // The depth per subtree
    public subDepth: number

    // The number of inputs per hash function
    public hashLength: number

    // The default value for empty leaves
    public zeroValue: BigInt

    // The current subtree index. e.g. the first subtree has index 0, the
    // second has 1, and so on
    public currentSubtreeIndex = 0

    // The hash function to use
    public hashFunc: (leaves: Leaf[]) => BigInt

    // The number of leaves across all subtrees
    public numLeaves = 0

    // The current subtree represented as leaves per level
    public levels: BigInt[][] = []

    // The next index at which to enqueue a leaf or subroot per level
    public nextIndexPerLevel: number[] = []

    // The root of each complete subtree
    public subRoots: BigInt[] = []

    // The root of merged subtrees
    public mainRoots: BigInt[] = []

    // The zero value per level. i.e. zeros[0] is zeroValue,
    // zeros[1] is the hash of leavesPerNode zeros, and so on.
    public zeros: BigInt[] = []

    // Whether the subtrees have been merged
    public subTreesMerged = false

    // For merging subtrees into the smallest tree
    public nextSRindexToQueue = 0
    public smallSRTroot: BigInt = BigInt(0)
    public queuedSRTlevels: BigInt[][] = []
    public queuedSRTindex: number[] = []

    constructor (
        _subDepth: number,
        _hashLength: number,
        _zeroValue: BigInt,
    ) {
        // This class supports either 2 leaves per node, or 5 leaves per node.
        // 5 is largest number of inputs which circomlib's Poseidon EVM hash
        // function implementation supports.

        assert(_hashLength === 2 || _hashLength === 5)
        assert(_subDepth > 0)

        this.hashLength = _hashLength
        this.subDepth = _subDepth
        this.zeroValue = _zeroValue

        // Set this.hashFunc depending on the number of leaves per node
        if (this.hashLength === 2) {
            // Uses PoseidonT3 under the hood, which accepts 2 inputs
            this.hashFunc = (inputs: BigInt[]) => {
                return hashLeftRight(inputs[0], inputs[1])
            }
        } else {
            // Uses PoseidonT6 under the hood, which accepts up to 5 inputs
            this.hashFunc = hash5
        }

        let hashed = this.zeroValue
        for (let i = 0; i < this.MAX_DEPTH; i ++) {
            this.zeros.push(hashed)
            let e: BigInt[] = []
            if (this.hashLength === 2) {
                e = [0].map(BigInt)
                hashed = this.hashFunc([hashed, hashed])
            } else {
                e = [0, 0, 0, 0].map(BigInt)
                hashed = this.hashFunc(
                    [hashed, hashed, hashed, hashed, hashed ],
                )
            }
            this.levels.push(e)
            this.nextIndexPerLevel[i] = 0
            this.queuedSRTlevels.push(e)
            this.queuedSRTindex[i] = 0
        }
    }

    public getSubRoot(_index: number) {
        return this.subRoots[_index]
    }

    /*
     * Enqueue a leaf into the current subtree
     * @param _leaf The leaf to insert.
     */
    public enqueue(
        _leaf: Leaf,
    ) {
        assert(this.numLeaves < this.hashLength ** this.MAX_DEPTH)

        // Ensure that _value is a BigInt
        _leaf = BigInt(_leaf)
        this.queue(_leaf, 0)

        this.numLeaves ++
        this.subTreesMerged = false
        this.smallSRTroot = BigInt(0)

        const subTreeCapacity = this.hashLength ** this.subDepth
        if (this.numLeaves % subTreeCapacity === 0) {
            this.subRoots[this.currentSubtreeIndex] = this.levels[this.subDepth][0]
            this.currentSubtreeIndex ++
            this.levels[this.subDepth][0] = BigInt(0)
            for (let i = 0; i < this.MAX_DEPTH; i ++) {
                this.nextIndexPerLevel[i] = 0
            }
        }
    }

    private queue(
        _leaf: Leaf,
        _level: number,
    ) {
        if (_level > this.subDepth) {
            return;
        }
        const n = this.nextIndexPerLevel[_level]

        if (n != this.hashLength - 1) {
            // Just store the leaf
            this.levels[_level][n] = _leaf
            this.nextIndexPerLevel[_level] ++
            return
        } else {
            let hashed: BigInt
            if (this.hashLength === 2) {
                hashed = this.hashFunc([this.levels[_level][0], _leaf])
                this.levels[_level][0] = BigInt(0)
            } else {
                hashed = this.hashFunc([...this.levels[_level], _leaf])
                for (let i = 0; i < 4; i ++) {
                    his.levels[_level][i] = BigInt(0)
                }
            }

            this.nextIndexPerLevel[_level] = 0

            // Recurse
            this.queue(hashed, _level + 1);
        }
    }


    /*
     * Fill any empty leaves of the last subtree with zeros and store the
     * resulting subroot.
     */
    public fillLastSubTree() {
        // The total capacity of the subtree
        const subTreeCapacity = this.hashLength ** this.subDepth

        if (this.numLeaves % subTreeCapacity === 0) {
            // If the subtree is completely empty, then the subroot is a
            // precalculated zero value
            this.subRoots[this.currentSubtreeIndex] = this.zeros[this.subDepth]

        } else {

            this._fillLastSubTree(0)

            // Store the subroot
            this.subRoots[this.currentSubtreeIndex] = this.levels[this.subDepth][0]

            // Blank out the subtree data
            for (let i = 0; i < this.subDepth + 1; i ++) {
                if (this.hashLength === 2) {
                    this.levels[i][0] = BigInt(0)
                } else {
                    this.levels[i] = [0, 0, 0, 0].map(BigInt)
                }
            }
        }

        // Update the subtree index
        this.currentSubtreeIndex ++

        // Update the number of leaves
        this.numLeaves = this.currentSubtreeIndex * subTreeCapacity

        this.subTreesMerged = false
        this.smallSRTroot = BigInt(0)
    }

    private _fillLastSubTree(_level: number) {
        if (_level > this.subDepth) {
            return
        }

        const n = this.nextIndexPerLevel[_level]

        if (n !== 0) {
            // Fill the subtree level and hash it
            let hashed: BigInt
            if (this.hashLength === 2) {
                hashed = this.hashFunc([
                    this.levels[_level][0],
                    this.zeros[_level],
                ])
            } else {
                for (let i = n; i < this.hashLength; i ++) {
                    this.levels[_level][i] = this.zeros[_level]
                }
                hashed = this.hashFunc(this.levels[_level])
            }

            // Update the subtree from the next level onwards with the new leaf
            this.queue(hashed, _level + 1)

            // Reset the current level
            this.nextIndexPerLevel[_level] = 0
        }

        // Recurse
        this._fillLastSubTree(_level + 1)
    }

    /*
     * Merge all the subroots into a tree of a specified depth.
     * It requires this.mergeSubRootsIntoShortestTree() to be run first.
     */
    public merge(_depth: number) {
        assert(this.subTreesMerged === true)
        assert(_depth >= this.subDepth)
        assert(_depth <= this.MAX_DEPTH)

        if (_depth === this.subDepth) {
            this.mainRoots[_depth] = this.smallSRTroot
        }

        let root = this.smallSRTroot
        for (let i = this.subDepth; i < _depth; i ++) {
            const inputs: BigInt[] = [root]
            for (let j = 1; j < this.hashLength; j ++) {
                inputs.push(this.zeros[_depth - i])
            }
            root = this.hashFunc(inputs)
        }

        this.mainRoots[_depth] = root
    }

    /*
     * Merge all the subroots into a tree of a specified depth.
     * Uses an IncrementalQuinTree instead of the two-step method that
     * AccQueue.sol uses. 
     */
    public mergeDirect(_depth: number) {
        // The desired main tree must be deep enough to fit all leaves
        assert(BigInt(_depth ** this.hashLength) >= this.numLeaves)

        // Fill any empty leaves in the last subtree with zeros
        if (this.numLeaves % (this.hashLength ** this.subDepth) > 0) {
            this.fillLastSubTree()
        }

        const tree = new IncrementalQuinTree(
            _depth - this.subDepth,
            this.zeros[this.subDepth],
            this.hashLength,
        )
        for (let i = 0; i < this.subRoots.length; i++) {
            tree.insert(this.subRoots[i])
        }

        this.mainRoots[_depth] = tree.root
    }

    /*
     * Merge all subroots into the smallest possible Merkle tree which fits
     * them. e.g. if there are 5 subroots and hashLength == 2, the tree depth
     * is 3 since 2 ** 3 = 8 which is the next power of 2.
     */
    public mergeSubRootsIntoShortestTree(
        _numSrQueueOps = 0,
    ) {
        // This function can only be called once unless a new subtree is created
        assert(this.subTreesMerged === false)

        // There must be subtrees to merge
        assert(this.numLeaves > 0)

        // Fill any empty leaves in the last subtree with zeros
        if (this.numLeaves % (this.hashLength ** this.subDepth) !== 0) {
            this.fillLastSubTree()
        }

        // If there is only 1 subtree, use its root
        if (this.currentSubtreeIndex === 1) {
            this.smallSRTroot = this.getSubRoot(0)
            this.subTreesMerged = true
            return
        }

        // Compute the depth and maximum capacity of the smallMainTreeRoot
        const depth = calcDepthFromNumLeaves(this.hashLength, this.numLeaves)

        let numQueueOps = 0

        for (let i = this.nextSRindexToQueue; i < this.currentSubtreeIndex; i ++) {
            // Stop if the limit has been reached
            if (_numSrQueueOps !== 0 && numQueueOps === _numSrQueueOps) {
                return
            }

            // Queue the next subroot
            this.queueSubRoot(
                this.getSubRoot(this.nextSRindexToQueue),
                0,
                depth - this.subDepth,
            )

            // Increment the next subroot counter
            this.nextSRindexToQueue ++
            numQueueOps ++
        }

        const m = this.hashLength ** (depth - this.subDepth)

        if (this.nextSRindexToQueue === this.currentSubtreeIndex) {
            for (let i = this.currentSubtreeIndex; i < m; i ++) {
                this.queueSubRoot(
                    this.zeros[depth - this.subDepth],
                    0,
                    depth - this.subDepth,
                )
            }

            // Store the smallest main root
            this.smallSRTroot = this.queuedSRTlevels[depth - this.subDepth][0]
            this.subTreesMerged = true
        }
    }

    /*
     * Queues the _leaf (a subroot) into queuedSRTlevels
     */
    private queueSubRoot(
        _leaf: BigInt,
        _level: number,
        _maxDepth: number,
    ) {
        if (_level > _maxDepth) { return }

        const n = this.queuedSRTindex[_level]

        if (n !== this.hashLength - 1) {
            // Just store the leaf
            this.queuedSRTlevels[_level][n] = _leaf
            this.queuedSRTindex[_level] ++
        } else {
            // Hash the elements in this level and queue it in the next level
            const inputs: BigInt[] = []
            for (let i = 0; i < this.hashLength - 1; i ++) {
                inputs.push(this.queuedSRTlevels[_level][i])
            }
            inputs.push(_leaf)
            const hashed = this.hashFunc(inputs)

            // Recurse
            this.queuedSRTindex[_level] = 0
            this.queueSubRoot(hashed, _level + 1, _maxDepth)
        }
    }

    public getRoot(_depth: number) {
        return this.mainRoots[_depth]
    }

    /*
     * Deep-copies this object
     */
    public copy(): AccQueue {
        const newAccQueue = new AccQueue(
            this.subDepth,
            this.hashLength,
            this.zeroValue,
        )
        newAccQueue.zeros = deepCopyBigIntArray(this.zeros)
        newAccQueue.currentSubtreeIndex = this.currentSubtreeIndex
        newAccQueue.numLeaves = this.numLeaves

        newAccQueue.levels = unstringifyBigInts(JSON.parse(
            JSON.stringify(stringifyBigInts(this.levels))
        ))
        newAccQueue.nextIndexPerLevel = JSON.parse(JSON.stringify(this.nextIndexPerLevel))
        newAccQueue.subRoots = deepCopyBigIntArray(this.subRoots)

        return newAccQueue
    }

    public hash(_leaves: BigInt[]): BigInt  {
        assert(_leaves.length === this.hashLength)
        return this.hashFunc(_leaves)
    }
}

export {
    AccQueue,
}
