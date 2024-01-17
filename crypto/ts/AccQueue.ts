import assert from "assert";

import type { Leaf, Queue, StringifiedBigInts } from "./types";

import { deepCopyBigIntArray, stringifyBigInts, unstringifyBigInts } from "./bigIntUtils";
import { sha256Hash, hashLeftRight, hash5 } from "./hashing";
import { IncrementalQuinTree } from "./quinTree";
import { calcDepthFromNumLeaves } from "./utils";

/**
 * An Accumulator Queue which conforms to the implementation in AccQueue.sol.
 * Each enqueue() operation updates a subtree, and a merge() operation combines
 * all subtrees into a main tree.
 * @notice It supports 2 or 5 elements per leaf.
 */
export class AccQueue {
  private MAX_DEPTH = 32;

  // The depth per subtree
  subDepth: number;

  // The number of inputs per hash function
  hashLength: number;

  // The default value for empty leaves
  zeroValue: bigint;

  // The current subtree index. e.g. the first subtree has index 0, the
  // second has 1, and so on
  currentSubtreeIndex = 0;

  // The hash function to use for the subtrees
  subHashFunc: (leaves: Leaf[]) => bigint;

  // The hash function to use for rest of the tree (above the subroots)
  hashFunc: (leaves: Leaf[]) => bigint;

  // The number of leaves across all subtrees
  numLeaves = 0;

  // The current subtree
  leafQueue: Queue = {
    levels: [],
    indices: [],
  };

  // For merging subtrees into the smallest tree
  nextSRindexToQueue = 0;

  smallSRTroot = BigInt(0);

  subRootQueue: Queue = {
    levels: [],
    indices: [],
  };

  // The root of each complete subtree
  subRoots: bigint[] = [];

  // The root of merged subtrees
  mainRoots: bigint[] = [];

  // The zero value per level. i.e. zeros[0] is zeroValue,
  // zeros[1] is the hash of leavesPerNode zeros, and so on.
  zeros: bigint[] = [];

  // Whether the subtrees have been merged
  subTreesMerged = false;

  /**
   * Create a new instance of AccQueue
   * @param subDepth - the depth of the subtrees
   * @param hashLength - the number of leaves per node
   * @param zeroValue - the default value for empty leaves
   */
  constructor(subDepth: number, hashLength: number, zeroValue: bigint) {
    // This class supports either 2 leaves per node, or 5 leaves per node.
    // 5 is largest number of inputs which circomlib's Poseidon EVM hash
    // function implementation supports.

    assert(hashLength === 2 || hashLength === 5);
    assert(subDepth > 0);

    this.hashLength = hashLength;
    this.subDepth = subDepth;
    this.zeroValue = zeroValue;

    // Set this.hashFunc depending on the number of leaves per node
    if (this.hashLength === 2) {
      // Uses PoseidonT3 under the hood, which accepts 2 inputs
      this.hashFunc = (inputs: bigint[]) => hashLeftRight(inputs[0], inputs[1]);
    } else {
      // Uses PoseidonT6 under the hood, which accepts up to 5 inputs
      this.hashFunc = hash5;
    }

    this.subHashFunc = sha256Hash;

    let hashed = this.zeroValue;
    for (let i = 0; i < this.MAX_DEPTH; i += 1) {
      this.zeros.push(hashed);

      let e: bigint[] = [];
      if (this.hashLength === 2) {
        e = [0].map(BigInt);
        hashed = this.hashFunc([hashed, hashed]);
      } else {
        e = [0, 0, 0, 0].map(BigInt);
        hashed = this.hashFunc([hashed, hashed, hashed, hashed, hashed]);
      }
      this.leafQueue.levels.push(e);
      this.leafQueue.indices[i] = 0;
      this.subRootQueue.levels.push(e);
      this.subRootQueue.indices[i] = 0;
    }
  }

  /**
   * Get the subroot at a given index
   * @param index - The index of the subroot
   * @returns the subroot
   */
  getSubRoot(index: number): bigint {
    return this.subRoots[index];
  }

  /**
   * Enqueue a leaf into the current subtree
   * @param leaf The leaf to insert.
   * @returns The index of the leaf
   */
  enqueue(leaf: Leaf): number {
    // validation
    assert(this.numLeaves < this.hashLength ** this.MAX_DEPTH, "AccQueue is full");

    this.enqueueOp(leaf, 0);

    // the index is the number of leaves (0-index)
    const leafIndex = this.numLeaves;

    // increase the number of leaves
    this.numLeaves += 1;
    // we set merged false because there are new leaves
    this.subTreesMerged = false;
    // reset the smallSRTroot because it is obsolete
    this.smallSRTroot = BigInt(0);

    // @todo this can be moved in the constructor rather than computing every time
    const subTreeCapacity = this.hashLength ** this.subDepth;
    // If the current subtree is full
    if (this.numLeaves % subTreeCapacity === 0) {
      // store the subroot
      const [subRoot] = this.leafQueue.levels[this.subDepth];
      this.subRoots[this.currentSubtreeIndex] = subRoot;
      this.currentSubtreeIndex += 1;
      // reset the current subtree
      this.leafQueue.levels[this.subDepth][0] = BigInt(0);
      for (let i = 0; i < this.MAX_DEPTH; i += 1) {
        this.leafQueue.indices[i] = 0;
      }
    }

    return leafIndex;
  }

  /**
   * Private function that performs the actual enqueue operation
   * @param leaf - The leaf to insert
   * @param level - The level of the subtree
   */
  private enqueueOp = (leaf: Leaf, level: number) => {
    // small validation, do no throw
    if (level > this.subDepth) {
      return;
    }

    // get the index to determine where to insert the next leaf
    const n = this.leafQueue.indices[level];

    // we check that the index is not the last one (1 or 4 depending on the hash length)
    if (n !== this.hashLength - 1) {
      // Just store the leaf
      this.leafQueue.levels[level][n] = leaf;
      this.leafQueue.indices[level] += 1;
    } else {
      // if not we compute the root
      let hashed: bigint;
      if (this.hashLength === 2) {
        hashed = this.hashFunc([this.leafQueue.levels[level][0], leaf]);
        this.leafQueue.levels[level][0] = BigInt(0);
      } else {
        hashed = this.hashFunc([...this.leafQueue.levels[level], leaf]);
        for (let i = 0; i < 4; i += 1) {
          this.leafQueue.levels[level][i] = BigInt(0);
        }
      }

      this.leafQueue.indices[level] = 0;

      // Recurse
      this.enqueueOp(hashed, level + 1);
    }
  };

  /**
   * Fill any empty leaves of the last subtree with zeros and store the
   * resulting subroot.
   */
  fill(): void {
    // The total capacity of the subtree
    const subTreeCapacity = this.hashLength ** this.subDepth;

    if (this.numLeaves % subTreeCapacity === 0) {
      // If the subtree is completely empty, then the subroot is a
      // precalculated zero value
      this.subRoots[this.currentSubtreeIndex] = this.zeros[this.subDepth];
    } else {
      this.fillOp(0);

      // Store the subroot
      const [subRoot] = this.leafQueue.levels[this.subDepth];
      this.subRoots[this.currentSubtreeIndex] = subRoot;

      // Blank out the subtree data
      for (let i = 0; i < this.subDepth + 1; i += 1) {
        if (this.hashLength === 2) {
          this.leafQueue.levels[i][0] = BigInt(0);
        } else {
          this.leafQueue.levels[i] = [0, 0, 0, 0].map(BigInt);
        }
      }
    }

    // Update the subtree index
    this.currentSubtreeIndex += 1;

    // Update the number of leaves
    this.numLeaves = this.currentSubtreeIndex * subTreeCapacity;

    this.subTreesMerged = false;
    this.smallSRTroot = BigInt(0);
  }

  /**
   * Private function that performs the actual fill operation
   * @param level - The level of the subtree
   */
  private fillOp(level: number) {
    if (level > this.subDepth) {
      return;
    }

    const n = this.leafQueue.indices[level];

    if (n !== 0) {
      // Fill the subtree level and hash it
      let hashed: bigint;
      if (this.hashLength === 2) {
        hashed = this.hashFunc([this.leafQueue.levels[level][0], this.zeros[level]]);
      } else {
        for (let i = n; i < this.hashLength; i += 1) {
          this.leafQueue.levels[level][i] = this.zeros[level];
        }
        hashed = this.hashFunc(this.leafQueue.levels[level]);
      }

      // Update the subtree from the next level onwards with the new leaf
      this.enqueueOp(hashed, level + 1);

      // Reset the current level
      this.leafQueue.indices[level] = 0;
    }

    // Recurse
    this.fillOp(level + 1);
  }

  /**
   * Calculate the depth of the smallest possible Merkle tree which fits all
   * @returns the depth of the smallest possible Merkle tree which fits all
   */
  calcSRTdepth(): number {
    // Calculate the SRT depth
    let srtDepth = this.subDepth;
    const subTreeCapacity = this.hashLength ** this.subDepth;
    while (this.hashLength ** srtDepth < this.subRoots.length * subTreeCapacity) {
      srtDepth += 1;
    }

    return srtDepth;
  }

  /**
   * Insert a subtree into the queue. This is used when the subtree is
   * already computed.
   * @param subRoot - The root of the subtree
   */
  insertSubTree(subRoot: bigint): void {
    // If the current subtree is not full, fill it.
    const subTreeCapacity = this.hashLength ** this.subDepth;

    this.subRoots[this.currentSubtreeIndex] = subRoot;

    // Update the subtree index
    this.currentSubtreeIndex += 1;

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
  merge(depth: number): void {
    assert(this.subTreesMerged);
    assert(depth <= this.MAX_DEPTH);

    const srtDepth = this.calcSRTdepth();

    assert(depth >= srtDepth);

    if (depth === srtDepth) {
      this.mainRoots[depth] = this.smallSRTroot;
    } else {
      let root = this.smallSRTroot;

      // Calculate the main root
      for (let i = srtDepth; i < depth; i += 1) {
        const inputs: bigint[] = [root];
        const z = this.zeros[i];

        for (let j = 1; j < this.hashLength; j += 1) {
          inputs.push(z);
        }

        root = this.hashFunc(inputs);
      }

      this.mainRoots[depth] = root;
    }
  }

  /**
   * Merge all the subroots into a tree of a specified depth.
   * Uses an IncrementalQuinTree instead of the two-step method that
   * AccQueue.sol uses.
   */
  mergeDirect(depth: number): void {
    // There must be subtrees to merge
    assert(this.numLeaves > 0);

    const srtDepth = this.calcSRTdepth();

    // The desired tree must be deep enough
    assert(depth >= srtDepth);

    if (depth === this.subDepth) {
      // If there is only 1 subtree, and the desired depth is the subtree
      // depth, the subroot is the result
      assert(this.numLeaves === this.hashLength ** this.subDepth);
      const [subRoot] = this.subRoots;
      this.mainRoots[depth] = subRoot;
      this.subTreesMerged = true;
      return;
    }

    // The desired main tree must be deep enough to fit all leaves
    assert(BigInt(depth ** this.hashLength) >= this.numLeaves);

    // Fill any empty leaves in the last subtree with zeros
    if (this.numLeaves % this.hashLength ** this.subDepth > 0) {
      this.fill();
    }

    const tree = new IncrementalQuinTree(
      depth - this.subDepth,
      this.zeros[this.subDepth],
      this.hashLength,
      this.hashFunc,
    );

    this.subRoots.forEach((subRoot) => {
      tree.insert(subRoot);
    });

    this.mainRoots[depth] = tree.root;
  }

  /**
   * Merge all subroots into the smallest possible Merkle tree which fits
   * them. e.g. if there are 5 subroots and hashLength == 2, the tree depth
   * is 3 since 2 ** 3 = 8 which is the next power of 2.
   * @param numSrQueueOps - The number of subroots to queue into the SRT
   */
  mergeSubRoots(numSrQueueOps = 0): void {
    // This function can only be called once unless a new subtree is created
    assert(!this.subTreesMerged);

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
    const depth = calcDepthFromNumLeaves(this.hashLength, this.currentSubtreeIndex);

    let numQueueOps = 0;

    for (let i = this.nextSRindexToQueue; i < this.currentSubtreeIndex; i += 1) {
      // Stop if the limit has been reached
      if (numSrQueueOps !== 0 && numQueueOps === numSrQueueOps) {
        return;
      }

      // Queue the next subroot
      const subRoot = this.getSubRoot(this.nextSRindexToQueue);
      this.queueSubRoot(subRoot, 0, depth);

      // Increment the next subroot counter
      this.nextSRindexToQueue += 1;
      numQueueOps += 1;
    }

    // Queue zeros to get the SRT. `m` is the number of leaves in the
    // main tree, which already has `this.currentSubtreeIndex` leaves
    const m = this.hashLength ** depth;
    if (this.nextSRindexToQueue === this.currentSubtreeIndex) {
      for (let i = this.currentSubtreeIndex; i < m; i += 1) {
        const z = this.zeros[this.subDepth];
        this.queueSubRoot(z, 0, depth);
      }
    }

    // Store the root
    const [subRoot] = this.subRootQueue.levels[depth];
    this.smallSRTroot = subRoot;
    this.subTreesMerged = true;
  }

  /**
   * Queues the leaf (a subroot) into queuedSRTlevels
   * @param leaf - The leaf to insert
   * @param level - The level of the subtree
   * @param maxDepth - The maximum depth of the tree
   */
  private queueSubRoot(leaf: bigint, level: number, maxDepth: number) {
    if (level > maxDepth) {
      return;
    }

    const n = this.subRootQueue.indices[level];

    if (n !== this.hashLength - 1) {
      // Just store the leaf
      this.subRootQueue.levels[level][n] = leaf;
      this.subRootQueue.indices[level] += 1;
    } else {
      // Hash the elements in this level and queue it in the next level
      const inputs: bigint[] = [];
      for (let i = 0; i < this.hashLength - 1; i += 1) {
        inputs.push(this.subRootQueue.levels[level][i]);
      }
      inputs.push(leaf);
      const hashed = this.hashFunc(inputs);

      // Recurse
      this.subRootQueue.indices[level] = 0;
      this.queueSubRoot(hashed, level + 1, maxDepth);
    }
  }

  /**
   * Get the root at a certain depth
   * @param depth - The depth of the tree
   * @returns the root
   */
  getRoot(depth: number): bigint | null | undefined {
    return this.mainRoots[depth];
  }

  /**
   * Check if the root at a certain depth exists (subtree root)
   * @param depth - the depth of the tree
   * @returns whether the root exists
   */
  hasRoot(depth: number): boolean {
    const root = this.getRoot(depth);
    return !(root === null || root === undefined);
  }

  /**
   * @notice Deep-copies this object
   * @returns a deep copy of this object
   */
  copy(): AccQueue {
    const newAccQueue = new AccQueue(this.subDepth, this.hashLength, this.zeroValue);
    newAccQueue.currentSubtreeIndex = JSON.parse(JSON.stringify(this.currentSubtreeIndex)) as number;
    newAccQueue.numLeaves = JSON.parse(JSON.stringify(this.numLeaves)) as number;
    newAccQueue.leafQueue.levels = unstringifyBigInts(
      JSON.parse(JSON.stringify(stringifyBigInts(this.leafQueue.levels))) as StringifiedBigInts,
    ) as bigint[][];
    newAccQueue.leafQueue.indices = JSON.parse(JSON.stringify(this.leafQueue.indices)) as number[];
    newAccQueue.subRoots = deepCopyBigIntArray(this.subRoots);
    newAccQueue.mainRoots = deepCopyBigIntArray(this.mainRoots);
    newAccQueue.zeros = deepCopyBigIntArray(this.zeros);
    newAccQueue.subTreesMerged = !!this.subTreesMerged;
    newAccQueue.nextSRindexToQueue = Number(this.nextSRindexToQueue.toString());
    newAccQueue.smallSRTroot = BigInt(this.smallSRTroot.toString());
    newAccQueue.subRootQueue.indices = JSON.parse(JSON.stringify(this.subRootQueue.indices)) as number[];
    newAccQueue.subRootQueue.levels = unstringifyBigInts(
      JSON.parse(JSON.stringify(stringifyBigInts(this.subRootQueue.levels))) as StringifiedBigInts,
    ) as bigint[][];

    return newAccQueue;
  }

  /**
   * Hash an array of leaves
   * @param leaves - The leaves to hash
   * @returns the hash value of the leaves
   */
  hash(leaves: bigint[]): bigint {
    assert(leaves.length === this.hashLength);
    return this.hashFunc(leaves);
  }
}
