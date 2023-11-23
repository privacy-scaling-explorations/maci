import * as assert from "assert";
import {
    sha256Hash,
    hashLeftRight,
    hash5,
    stringifyBigInts,
    unstringifyBigInts,
    IncrementalQuinTree,
} from "./index";
import { Leaf, Queue } from "./types";
import { calcDepthFromNumLeaves, deepCopyBigIntArray } from "./utils";

/**
 * An Accumulator Queue which conforms to the implementation in AccQueue.sol.
 * Each enqueue() operation updates a subtree, and a merge() operation combines
 * all subtrees into a main tree.
 * @notice It supports 2 or 5 elements per leaf.
 */
export class AccQueue {
    private MAX_DEPTH = 32;

    // The depth per subtree
    public subDepth: number;

    // The number of inputs per hash function
    public hashLength: number;

    // The default value for empty leaves
    public zeroValue: bigint;

    // The current subtree index. e.g. the first subtree has index 0, the
    // second has 1, and so on
    public currentSubtreeIndex = 0;

    // The hash function to use for the subtrees
    public subHashFunc: (leaves: Leaf[]) => bigint;

    // The hash function to use for rest of the tree (above the subroots)
    public hashFunc: (leaves: Leaf[]) => bigint;

    // The number of leaves across all subtrees
    public numLeaves = 0;

    // The current subtree
    public leafQueue: Queue = {
        levels: [],
        indices: [],
    };

    // For merging subtrees into the smallest tree
    public nextSRindexToQueue = 0;
    public smallSRTroot = BigInt(0);
    public subRootQueue: Queue = {
        levels: [],
        indices: [],
    };

    // The root of each complete subtree
    public subRoots: bigint[] = [];

    // The root of merged subtrees
    public mainRoots: bigint[] = [];

    // The zero value per level. i.e. zeros[0] is zeroValue,
    // zeros[1] is the hash of leavesPerNode zeros, and so on.
    public zeros: bigint[] = [];

    // Whether the subtrees have been merged
    public subTreesMerged = false;

    /**
     * Create a new instance of AccQueue
     * @param _subDepth - the depth of the subtrees
     * @param _hashLength - the number of leaves per node
     * @param _zeroValue - the default value for empty leaves
     */
    constructor(_subDepth: number, _hashLength: number, _zeroValue: bigint) {
        // This class supports either 2 leaves per node, or 5 leaves per node.
        // 5 is largest number of inputs which circomlib's Poseidon EVM hash
        // function implementation supports.

        assert(_hashLength === 2 || _hashLength === 5);
        assert(_subDepth > 0);

        this.hashLength = _hashLength;
        this.subDepth = _subDepth;
        this.zeroValue = _zeroValue;

        // Set this.hashFunc depending on the number of leaves per node
        if (this.hashLength === 2) {
            // Uses PoseidonT3 under the hood, which accepts 2 inputs
            this.hashFunc = (inputs: bigint[]) => {
                return hashLeftRight(inputs[0], inputs[1]);
            };
        } else {
            // Uses PoseidonT6 under the hood, which accepts up to 5 inputs
            this.hashFunc = hash5;
        }

        this.subHashFunc = sha256Hash;

        let hashed = this.zeroValue;
        for (let i = 0; i < this.MAX_DEPTH; i++) {
            this.zeros.push(hashed);

            let e: bigint[] = [];
            if (this.hashLength === 2) {
                e = [0].map(BigInt);
                hashed = this.hashFunc([hashed, hashed]);
            } else {
                e = [0, 0, 0, 0].map(BigInt);
                hashed = this.hashFunc([
                    hashed,
                    hashed,
                    hashed,
                    hashed,
                    hashed,
                ]);
            }
            this.leafQueue.levels.push(e);
            this.leafQueue.indices[i] = 0;
            this.subRootQueue.levels.push(e);
            this.subRootQueue.indices[i] = 0;
        }
    }

    /**
     * Get the subroot at a given index
     * @param _index - The index of the subroot
     * @returns the subroot
     */
    public getSubRoot(_index: number): bigint {
        return this.subRoots[_index];
    }

    /**
     * Enqueue a leaf into the current subtree
     * @param _leaf The leaf to insert.
     * @returns The index of the leaf
     */
    public enqueue(_leaf: Leaf): number {
        // validation
        assert(
            this.numLeaves < this.hashLength ** this.MAX_DEPTH,
            "AccQueue is full"
        );

        this._enqueue(_leaf, 0);

        // the index is the number of leaves (0-index)
        const leafIndex = this.numLeaves;

        // increase the number of leaves
        this.numLeaves++;
        // we set merged false because there are new leaves
        this.subTreesMerged = false;
        // reset the smallSRTroot because it is obsolete
        this.smallSRTroot = BigInt(0);

        // @todo this can be moved in the constructor rather than computing every time
        const subTreeCapacity = this.hashLength ** this.subDepth;
        // If the current subtree is full
        if (this.numLeaves % subTreeCapacity === 0) {
            // store the subroot
            this.subRoots[this.currentSubtreeIndex] =
                this.leafQueue.levels[this.subDepth][0];
            this.currentSubtreeIndex++;
            // reset the current subtree
            this.leafQueue.levels[this.subDepth][0] = BigInt(0);
            for (let i = 0; i < this.MAX_DEPTH; i++) {
                this.leafQueue.indices[i] = 0;
            }
        }

        return leafIndex;
    }

    /**
     * Private function that performs the actual enqueue operation
     * @param _leaf - The leaf to insert
     * @param _level - The level of the subtree
     */
    private _enqueue = (_leaf: Leaf, _level: number) => {
        // small validation, do no throw
        if (_level > this.subDepth) return;

        // get the index to determine where to insert the next leaf
        const n = this.leafQueue.indices[_level];

        // we check that the index is not the last one (1 or 4 depending on the hash length)
        if (n !== this.hashLength - 1) {
            // Just store the leaf
            this.leafQueue.levels[_level][n] = _leaf;
            this.leafQueue.indices[_level]++;
        } else {
            // if not we compute the root
            let hashed: bigint;
            if (this.hashLength === 2) {
                hashed = this.hashFunc([
                    this.leafQueue.levels[_level][0],
                    _leaf,
                ]);
                this.leafQueue.levels[_level][0] = BigInt(0);
            } else {
                hashed = this.hashFunc([
                    ...this.leafQueue.levels[_level],
                    _leaf,
                ]);
                for (let i = 0; i < 4; i++) {
                    this.leafQueue.levels[_level][i] = BigInt(0);
                }
            }

            this.leafQueue.indices[_level] = 0;

            // Recurse
            this._enqueue(hashed, _level + 1);
        }
    };

    /**
     * Fill any empty leaves of the last subtree with zeros and store the
     * resulting subroot.
     */
    public fill() {
        // The total capacity of the subtree
        const subTreeCapacity = this.hashLength ** this.subDepth;

        if (this.numLeaves % subTreeCapacity === 0) {
            // If the subtree is completely empty, then the subroot is a
            // precalculated zero value
            this.subRoots[this.currentSubtreeIndex] = this.zeros[this.subDepth];
        } else {
            this._fill(0);

            // Store the subroot
            this.subRoots[this.currentSubtreeIndex] =
                this.leafQueue.levels[this.subDepth][0];

            // Blank out the subtree data
            for (let i = 0; i < this.subDepth + 1; i++) {
                if (this.hashLength === 2) {
                    this.leafQueue.levels[i][0] = BigInt(0);
                } else {
                    this.leafQueue.levels[i] = [0, 0, 0, 0].map(BigInt);
                }
            }
        }

        // Update the subtree index
        this.currentSubtreeIndex++;

        // Update the number of leaves
        this.numLeaves = this.currentSubtreeIndex * subTreeCapacity;

        this.subTreesMerged = false;
        this.smallSRTroot = BigInt(0);
    }

    /**
     * Private function that performs the actual fill operation
     * @param _level - The level of the subtree
     */
    private _fill(_level: number) {
        if (_level > this.subDepth) return;

        const n = this.leafQueue.indices[_level];

        if (n !== 0) {
            // Fill the subtree level and hash it
            let hashed: bigint;
            if (this.hashLength === 2) {
                hashed = this.hashFunc([
                    this.leafQueue.levels[_level][0],
                    this.zeros[_level],
                ]);
            } else {
                for (let i = n; i < this.hashLength; i++) {
                    this.leafQueue.levels[_level][i] = this.zeros[_level];
                }
                hashed = this.hashFunc(this.leafQueue.levels[_level]);
            }

            // Update the subtree from the next level onwards with the new leaf
            this._enqueue(hashed, _level + 1);

            // Reset the current level
            this.leafQueue.indices[_level] = 0;
        }

        // Recurse
        this._fill(_level + 1);
    }

    /**
     * Calculate the depth of the smallest possible Merkle tree which fits all
     * @returns the depth of the smallest possible Merkle tree which fits all
     */
    public calcSRTdepth(): number {
        // Calculate the SRT depth
        let srtDepth = this.subDepth;
        const subTreeCapacity = this.hashLength ** this.subDepth;
        while (true) {
            if (
                this.hashLength ** srtDepth >=
                this.subRoots.length * subTreeCapacity
            ) {
                break;
            }
            srtDepth++;
        }

        return srtDepth;
    }

    /**
     * Insert a subtree into the queue. This is used when the subtree is
     * already computed.
     * @param _subRoot - The root of the subtree
     */
    public insertSubTree(_subRoot: bigint) {
        // If the current subtree is not full, fill it.
        const subTreeCapacity = this.hashLength ** this.subDepth;

        this.subRoots[this.currentSubtreeIndex] = _subRoot;

        // Update the subtree index
        this.currentSubtreeIndex++;

        // Update the number of leaves
        this.numLeaves += subTreeCapacity;

        // Reset the subroot tree root now that it is obsolete
        this.smallSRTroot = BigInt(0);

        this.subTreesMerged = false;
    }

    /**
     * Merge all the subroots into a tree of a specified depth.
     * It requires this.mergeSubRoots() to be run first.
     */
    public merge(_depth: number) {
        assert(this.subTreesMerged === true);
        assert(_depth <= this.MAX_DEPTH);

        const srtDepth = this.calcSRTdepth();

        assert(_depth >= srtDepth);

        if (_depth === srtDepth) {
            this.mainRoots[_depth] = this.smallSRTroot;
        } else {
            let root = this.smallSRTroot;

            // Calculate the main root
            for (let i = srtDepth; i < _depth; i++) {
                const inputs: bigint[] = [root];
                const z = this.zeros[i];

                for (let j = 1; j < this.hashLength; j++) {
                    inputs.push(z);
                }

                root = this.hashFunc(inputs);
            }

            this.mainRoots[_depth] = root;
        }
    }

    /**
     * Merge all the subroots into a tree of a specified depth.
     * Uses an IncrementalQuinTree instead of the two-step method that
     * AccQueue.sol uses.
     */
    public mergeDirect(_depth: number) {
        // There must be subtrees to merge
        assert(this.numLeaves > 0);

        const srtDepth = this.calcSRTdepth();

        // The desired tree must be deep enough
        assert(_depth >= srtDepth);

        if (_depth === this.subDepth) {
            // If there is only 1 subtree, and the desired depth is the subtree
            // depth, the subroot is the result
            assert(this.numLeaves === this.hashLength ** this.subDepth);
            this.mainRoots[_depth] = this.subRoots[0];
            this.subTreesMerged = true;
            return;
        }

        // The desired main tree must be deep enough to fit all leaves
        assert(BigInt(_depth ** this.hashLength) >= this.numLeaves);

        // Fill any empty leaves in the last subtree with zeros
        if (this.numLeaves % this.hashLength ** this.subDepth > 0) {
            this.fill();
        }

        const tree = new IncrementalQuinTree(
            _depth - this.subDepth,
            this.zeros[this.subDepth],
            this.hashLength,
            this.hashFunc
        );

        for (let i = 0; i < this.subRoots.length; i++) {
            tree.insert(this.subRoots[i]);
        }

        this.mainRoots[_depth] = tree.root;
    }

    /**
     * Merge all subroots into the smallest possible Merkle tree which fits
     * them. e.g. if there are 5 subroots and hashLength == 2, the tree depth
     * is 3 since 2 ** 3 = 8 which is the next power of 2.
     * @param _numSrQueueOps - The number of subroots to queue into the SRT
     */
    public mergeSubRoots(_numSrQueueOps = 0) {
        // This function can only be called once unless a new subtree is created
        assert(this.subTreesMerged === false);

        // There must be subtrees to merge
        assert(this.numLeaves > 0);

        // Fill any empty leaves in the last subtree with zeros
        if (this.numLeaves % this.hashLength ** this.subDepth !== 0) {
            this.fill();
        }

        // If there is only 1 subtree, use its root
        if (this.currentSubtreeIndex === 1) {
            this.smallSRTroot = this.getSubRoot(0);
            this.subTreesMerged = true;
            return;
        }

        // Compute the depth and maximum capacity of the smallMainTreeRoot
        const depth = calcDepthFromNumLeaves(
            this.hashLength,
            this.currentSubtreeIndex
        );

        let numQueueOps = 0;

        for (
            let i = this.nextSRindexToQueue;
            i < this.currentSubtreeIndex;
            i++
        ) {
            // Stop if the limit has been reached
            if (_numSrQueueOps !== 0 && numQueueOps === _numSrQueueOps) {
                return;
            }

            // Queue the next subroot
            const subRoot = this.getSubRoot(this.nextSRindexToQueue);
            this.queueSubRoot(subRoot, 0, depth);

            // Increment the next subroot counter
            this.nextSRindexToQueue++;
            numQueueOps++;
        }

        // Queue zeros to get the SRT. `m` is the number of leaves in the
        // main tree, which already has `this.currentSubtreeIndex` leaves
        const m = this.hashLength ** depth;
        if (this.nextSRindexToQueue === this.currentSubtreeIndex) {
            for (let i = this.currentSubtreeIndex; i < m; i++) {
                const z = this.zeros[this.subDepth];
                this.queueSubRoot(z, 0, depth);
            }
        }

        // Store the root
        this.smallSRTroot = this.subRootQueue.levels[depth][0];
        this.subTreesMerged = true;
    }

    /**
     * Queues the _leaf (a subroot) into queuedSRTlevels
     * @param _leaf - The leaf to insert
     * @param _level - The level of the subtree
     * @param _maxDepth - The maximum depth of the tree
     */
    private queueSubRoot(_leaf: bigint, _level: number, _maxDepth: number) {
        if (_level > _maxDepth) {
            return;
        }

        const n = this.subRootQueue.indices[_level];

        if (n !== this.hashLength - 1) {
            // Just store the leaf
            this.subRootQueue.levels[_level][n] = _leaf;
            this.subRootQueue.indices[_level]++;
        } else {
            // Hash the elements in this level and queue it in the next level
            const inputs: bigint[] = [];
            for (let i = 0; i < this.hashLength - 1; i++) {
                inputs.push(this.subRootQueue.levels[_level][i]);
            }
            inputs.push(_leaf);
            const hashed = this.hashFunc(inputs);

            // Recurse
            this.subRootQueue.indices[_level] = 0;
            this.queueSubRoot(hashed, _level + 1, _maxDepth);
        }
    }

    /**
     * Get the root at a certain depth
     * @param _depth - The depth of the tree
     * @returns the root
     */
    public getRoot(_depth: number): bigint {
        return this.mainRoots[_depth];
    }

    /**
     * Check if the root at a certain depth exists (subtree root)
     * @param _depth - the depth of the tree
     * @returns whether the root exists
     */
    public hasRoot(_depth: number): boolean {
        const root = this.getRoot(_depth);
        return !(root == null || root == undefined);
    }

    /**
     * @notice Deep-copies this object
     * @returns a deep copy of this object
     */
    public copy(): AccQueue {
        const newAccQueue = new AccQueue(
            this.subDepth,
            this.hashLength,
            this.zeroValue
        );
        newAccQueue.currentSubtreeIndex = JSON.parse(
            JSON.stringify(this.currentSubtreeIndex)
        );
        newAccQueue.numLeaves = JSON.parse(JSON.stringify(this.numLeaves));
        newAccQueue.leafQueue.levels = unstringifyBigInts(
            JSON.parse(JSON.stringify(stringifyBigInts(this.leafQueue.levels)))
        );
        newAccQueue.leafQueue.indices = JSON.parse(
            JSON.stringify(this.leafQueue.indices)
        );
        newAccQueue.subRoots = deepCopyBigIntArray(this.subRoots);
        newAccQueue.mainRoots = deepCopyBigIntArray(this.mainRoots);
        newAccQueue.zeros = deepCopyBigIntArray(this.zeros);
        newAccQueue.subTreesMerged = this.subTreesMerged ? true : false;
        newAccQueue.nextSRindexToQueue = Number(
            this.nextSRindexToQueue.toString()
        );
        newAccQueue.smallSRTroot = BigInt(this.smallSRTroot.toString());
        newAccQueue.subRootQueue.indices = JSON.parse(
            JSON.stringify(this.subRootQueue.indices)
        );
        newAccQueue.subRootQueue.levels = unstringifyBigInts(
            JSON.parse(
                JSON.stringify(stringifyBigInts(this.subRootQueue.levels))
            )
        );

        return newAccQueue;
    }

    /**
     * Hash an array of leaves
     * @param _leaves - The leaves to hash
     * @returns the hash value of the leaves
     */
    public hash(_leaves: bigint[]): bigint {
        assert(_leaves.length === this.hashLength);
        return this.hashFunc(_leaves);
    }
}
