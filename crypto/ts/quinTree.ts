import type { Leaf, Node, IMerkleProof } from "./types";

/**
 * An implementation of an incremental Merkle tree
 * @dev adapted from https://github.com/weijiekoh/optimisedmt
 */
export class IncrementalQuinTree {
  // how many levels
  depth: number;

  // the zero value
  zeroValue: bigint;

  // the number of leaves per node
  arity: number;

  // the hash function used in the tree
  hashFunc: (leaves: Leaf[]) => bigint;

  // The the smallest empty leaf index
  nextIndex = 0;

  // Contains the zero value per level. i.e. zeros[0] is zeroValue,
  // zeros[1] is the hash of leavesPerNode zeros, and so on.
  zeros: bigint[] = [];

  root: bigint;

  nodes: Node;

  numNodes: number;

  capacity: number;

  /**
   * Create a new instance of the MaciQuinTree
   * @param depth The depth of the tree
   * @param zeroValue The zero value of the tree
   * @param arity The arity of the tree
   * @param hashFunc The hash function of the tree
   */
  constructor(depth: number, zeroValue: bigint, arity: number, hashFunc: (leaves: bigint[]) => bigint) {
    this.depth = depth;
    this.zeroValue = zeroValue;
    this.arity = arity;
    this.hashFunc = hashFunc;

    // calculate the initial values
    const { zeros, root } = this.calcInitialVals(this.arity, this.depth, this.zeroValue, this.hashFunc);
    this.zeros = zeros;
    this.root = root;

    // calculate the number of nodes
    this.numNodes = (this.arity ** (this.depth + 1) - 1) / (this.arity - 1);

    // initialize the nodes
    this.nodes = {};
    // set the root node
    this.nodes[this.numNodes - 1] = root;
    // calculate the capacity
    this.capacity = this.arity ** this.depth;
  }

  /**
   * Insert a leaf at the next available index
   * @param value The value to insert
   */
  insert(value: Leaf): void {
    // update the node with this leaf
    this.update(this.nextIndex, value);
    this.nextIndex += 1;
  }

  /**
   * Update a leaf at a given index
   * @param index The index of the leaf to update
   * @param value The value to update the leaf with
   */
  update(index: number, value: Leaf): void {
    // Set the leaf value
    this.setNode(index, value);

    // Set the parent leaf value
    // Get the parent indices
    const parentIndices = this.calcParentIndices(index);

    parentIndices.forEach((parentIndex) => {
      const childIndices = this.calcChildIndices(parentIndex);

      const elements: Leaf[] = [];
      childIndices.forEach((childIndex) => {
        elements.push(this.getNode(childIndex));
      });
      this.nodes[parentIndex] = this.hashFunc(elements);
    });

    this.root = this.nodes[this.numNodes - 1];
  }

  /**
   * Calculate the indices of the leaves in the path to the root
   * @param index The index of the leaf
   * @returns The indices of the leaves in the path to the root
   */
  calcLeafIndices(index: number): number[] {
    const indices = new Array<number>(this.depth);

    let r = index;
    for (let i = 0; i < this.depth; i += 1) {
      indices[i] = r % this.arity;
      r = Math.floor(r / this.arity);
    }

    return indices;
  }

  /**
   * Generate a proof for a given leaf index
   * @param index The index of the leaf to generate a proof for
   * @returns The proof
   */
  genProof(index: number): IMerkleProof {
    if (index < 0) {
      throw new Error("The leaf index must be greater or equal to 0");
    }

    if (index >= this.capacity) {
      throw new Error("+The leaf index must be less than the tree capacity");
    }

    const pathElements: bigint[][] = [];
    const indices = this.calcLeafIndices(index);

    // Calculate path elements
    let leafIndex = index;
    let offset = 0;

    for (let i = 0; i < this.depth; i += 1) {
      const elements: bigint[] = [];
      const start = leafIndex - (leafIndex % this.arity) + offset;

      for (let j = 0; j < this.arity; j += 1) {
        if (j !== indices[i]) {
          const node = this.getNode(start + j);
          elements.push(node);
        }
      }

      pathElements.push(elements);
      leafIndex = Math.floor(leafIndex / this.arity);
      offset += this.arity ** (this.depth - i);
    }

    return {
      pathElements,
      pathIndices: indices,
      root: this.root,
      leaf: this.getNode(index),
    };
  }

  /**
   * Generates a Merkle proof from a subroot to the root.
   * @param startIndex The index of the first leaf
   * @param endIndex The index of the last leaf
   * @returns The Merkle proof
   */
  genSubrootProof(
    // inclusive
    startIndex: number,
    // exclusive
    endIndex: number,
  ): IMerkleProof {
    // The end index must be greater than the start index
    if (startIndex >= endIndex) {
      throw new Error("The start index must be less than the end index");
    }

    if (startIndex < 0) {
      throw new Error("The start index must be greater or equal to 0");
    }

    // count the number of leaves
    const numLeaves = endIndex - startIndex;

    // The number of leaves must be a multiple of the tree arity
    if (numLeaves % this.arity !== 0) {
      throw new Error("The number of leaves must be a multiple of the tree arity");
    }

    // The number of leaves must be lower than the maximum tree capacity
    if (numLeaves >= this.capacity) {
      throw new Error("The number of leaves must be less than the tree capacity");
    }

    // Calculate the subdepth
    let subDepth = 0;
    while (numLeaves !== this.arity ** subDepth && subDepth < this.depth) {
      subDepth += 1;
    }

    const subTree = new IncrementalQuinTree(subDepth, this.zeroValue, this.arity, this.hashFunc);

    for (let i = startIndex; i < endIndex; i += 1) {
      subTree.insert(this.getNode(i));
    }

    const fullPath = this.genProof(startIndex);
    fullPath.pathIndices = fullPath.pathIndices.slice(subDepth, this.depth);
    fullPath.pathElements = fullPath.pathElements.slice(subDepth, this.depth);
    fullPath.leaf = subTree.root;

    return fullPath;
  }

  /**
   * Verify a proof
   * @param proof The proof to verify
   * @returns Wether the proof is valid
   */
  verifyProof = (proof: IMerkleProof): boolean => {
    const { pathElements, leaf, root, pathIndices } = proof;

    // Hash the first level
    const firstLevel: bigint[] = pathElements[0].map(BigInt);

    firstLevel.splice(Number(pathIndices[0]), 0, leaf);

    let currentLevelHash: bigint = this.hashFunc(firstLevel);

    // Verify the proof
    for (let i = 1; i < pathElements.length; i += 1) {
      const level: bigint[] = pathElements[i].map(BigInt);
      level.splice(Number(pathIndices[i]), 0, currentLevelHash);

      currentLevelHash = this.hashFunc(level);
    }

    // the path is valid if the root matches the calculated root
    return currentLevelHash === root;
  };

  /**
   * Calculate the indices of the parent
   * @param index The index of the leaf
   * @returns The indices of the parent
   */
  calcParentIndices(index: number): number[] {
    // can only calculate the parent for leaves not subroots
    if (index >= this.capacity || index < 0) {
      throw new Error(`Index ${index} is out of bounds. Can only get parents of leaves`);
    }

    const indices = new Array<number>(this.depth);
    let r = index;
    let levelCapacity = 0;

    for (let i = 0; i < this.depth; i += 1) {
      levelCapacity += this.arity ** (this.depth - i);
      r = Math.floor(r / this.arity);
      indices.push(levelCapacity + r);
    }

    return indices;
  }

  /**
   * Calculate the indices of the children of a node
   * @param index The index of the node
   * @returns The indices of the children
   */
  calcChildIndices(index: number): number[] {
    // cannot get the children of a leaf
    if (index < this.capacity || index < 0) {
      throw new Error(`Index ${index} is out of bounds. Can only get children of subroots`);
    }

    // find the level
    let level = 0;
    let r = this.arity ** level;
    do {
      level += 1;
      r += this.arity ** level;
    } while (index >= r);

    const start = (index - this.arity ** level) * this.arity;
    const indices = Array<number>(this.arity)
      .fill(0)
      .map((_, i) => start + i);

    return indices;
  }

  /**
   * Get a node at a given index
   * @param index The index of the node
   * @returns The node
   */
  getNode(index: number): Leaf {
    // if we have it, just return it
    if (this.nodes[index]) {
      return this.nodes[index];
    }

    // find the zero value at that level
    // first need to find the level
    let runningTotal = 0;
    let level = this.depth;

    while (level >= 0) {
      runningTotal += this.arity ** level;
      if (index < runningTotal) {
        break;
      }

      level -= 1;
    }

    return this.zeros[this.depth - level];
  }

  /**
   * Set a node (not the root)
   * @param index the index of the node
   * @param value the value of the node
   */
  setNode(index: number, value: Leaf): void {
    if (index > this.numNodes - 1 || index < 0) {
      throw new Error("Index out of bounds");
    }
    this.nodes[index] = value;
  }

  /**
   * Copy the tree to a new instance
   * @returns The new instance
   */
  copy(): IncrementalQuinTree {
    const newTree = new IncrementalQuinTree(this.depth, this.zeroValue, this.arity, this.hashFunc);

    newTree.nodes = this.nodes;
    newTree.numNodes = this.numNodes;
    newTree.zeros = this.zeros;
    newTree.root = this.root;
    newTree.nextIndex = this.nextIndex;

    return newTree;
  }

  /**
   * Calculate the zeroes and the root of a tree
   * @param arity The arity of the tree
   * @param depth The depth of the tree
   * @param zeroValue The zero value of the tree
   * @param hashFunc The hash function of the tree
   * @returns The zeros and the root
   */
  private calcInitialVals = (
    arity: number,
    depth: number,
    zeroValue: bigint,
    hashFunc: (leaves: bigint[]) => bigint,
  ): { zeros: bigint[]; root: bigint } => {
    const zeros: bigint[] = [];
    let currentLevelHash = zeroValue;

    for (let i = 0; i < depth; i += 1) {
      zeros.push(currentLevelHash);

      const z = Array<bigint>(arity).fill(currentLevelHash);

      currentLevelHash = hashFunc(z);
    }

    return { zeros, root: currentLevelHash };
  };
}
