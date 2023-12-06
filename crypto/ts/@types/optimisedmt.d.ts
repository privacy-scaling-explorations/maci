declare module "optimisedmt" {
  export type Leaf = bigint;
  export type PathElements = bigint[][];
  export type Indices = number[];
  export type FilledPath = Record<number, bigint>;

  interface MerkleProof {
    pathElements: PathElements;
    indices: Indices;
    depth: number;
    root: bigint;
    leaf: Leaf;
  }

  export class IncrementalTree {
    leavesPerNode: number;

    depth: number;

    zeroValue: bigint;

    root: bigint;

    nextIndex: number;

    leaves: Leaf[];

    zeros: bigint[];

    filledSubtrees: bigint[][];

    filledPaths: FilledPath;

    hashFunc: (leaves: bigint[]) => bigint;

    constructor(
      depth: number,
      zeroValue: bigint | number,
      leavesPerNode: number,
      hashFunc: (leaves: bigint[]) => bigint,
    );

    insert(value: Leaf): void;

    update(index: number, value: Leaf): void;

    getLeaf(index: number): Leaf;

    genMerkleSubrootPath(
      startIndex: number, // inclusive
      endIndex: number,
    ): MerkleProof;

    genMerklePath(index: number): MerkleProof;

    static verifyMerklePath(proof: MerkleProof, hashFunc: (leaves: bigint[]) => bigint): boolean;

    copy(): IncrementalTree;

    equals(t: IncrementalTree): boolean;
  }

  export class MultiIncrementalTree {
    leavesPerNode: number;

    depth: number;

    zeroValue: bigint;

    currentTreeNum: number;

    roots: bigint[];

    nextIndex: number;

    leaves: Leaf[];

    zeros: bigint[];

    filledSubtrees: bigint[][][];

    filledPaths: FilledPath[];

    hashFunc: (leaves: bigint[]) => bigint;

    constructor(
      depth: number,
      zeroValue: bigint | number,
      leavesPerNode: number,
      hashFunc: (leaves: bigint[]) => bigint,
    );

    insert(value: Leaf): void;

    update(absoluteIndex: number, value: Leaf): void;

    getLeaf(index: number): Leaf;

    genMerkleSubrootPath(
      absoluteStartIndex: number, // inclusive
      absoluteEndIndex: number,
    ): MerkleProof;

    genMerklePath(absoluteIndex: number): MerkleProof;

    static verifyMerklePath(proof: MerkleProof, hashFunc: (leaves: bigint[]) => bigint): boolean;

    copy(): MultiIncrementalTree;

    equals(t: MultiIncrementalTree): boolean;
  }

  export class OptimisedMT {
    depth: number;

    zeroValue: bigint;

    leavesPerNode: number;

    hashFunc: (leaves: bigint[]) => bigint;

    nextIndex: number;

    zeros: bigint[];

    root: bigint;

    nodes: MTNode;

    numNodes: number;

    capacity: number;

    constructor(depth: number, zeroValue: bigint, leavesPerNode: number, _hashFunc: (leaves: bigint[]) => bigint);

    insert(value: Leaf): void;

    update(index: number, value: Leaf): void;

    genMerklePath(index: number): MerkleProof;

    genMerkleSubrootPath(
      startIndex: number, // inclusive
      endIndex: number,
    ): MerkleProof;

    static verifyMerklePath: (proof: MerkleProof, hashFunc: (leaves: bigint[]) => bigint) => boolean;

    getLeaf(index: number): bigint;

    getNode(index: number): bigint;

    setNode(index: number, value: bigint): void;

    private getChildIndices;

    static calcChildIndices(index: number, leavesPerNode: number, depth: number): number[];

    private getParentIndices;

    static calcParentIndices(index: number, leavesPerNode: number, depth: number): number[];

    copy(): OptimisedMT;

    serialize: () => string;

    equals: (o: OptimisedMT) => boolean;

    static unserialize: (s: string) => OptimisedMT;
  }
  export const calcInitialVals: (
    leavesPerNode: number,
    depth: number,
    zeroValue: bigint,
    hashFunc: (leaves: bigint[]) => bigint,
  ) => {
    zeros: bigint[];
    root: bigint;
  };

  export type MTNode = Record<number, bigint>;
  export const calculateRoot: (leaves: bigint[], arity: number, hashFunc: (leaves: bigint[]) => bigint) => bigint;
}
