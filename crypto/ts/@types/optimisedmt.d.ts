declare module "optimisedmt" {
  export type Leaf = bigint;
  export type PathElements = bigint[][];
  export type Indices = number[];
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
    /* eslint-disable-next-line */
    filledPaths: any;

    hashFunc: (leaves: bigint[]) => bigint;

    constructor(
      _depth: number,
      _zeroValue: bigint | number,
      _leavesPerNode: number,
      _hashFunc: (leaves: bigint[]) => bigint,
    );

    insert(_value: Leaf): void;

    update(_index: number, _value: Leaf): void;

    getLeaf(_index: number): Leaf;

    genMerkleSubrootPath(
      _startIndex: number, // inclusive
      _endIndex: number,
    ): MerkleProof;

    genMerklePath(_index: number): MerkleProof;

    static verifyMerklePath(_proof: MerkleProof, _hashFunc: (leaves: bigint[]) => bigint): boolean;

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
    /* eslint-disable-next-line */
    filledPaths: any[];

    hashFunc: (leaves: bigint[]) => bigint;

    constructor(
      _depth: number,
      _zeroValue: bigint | number,
      _leavesPerNode: number,
      _hashFunc: (leaves: bigint[]) => bigint,
    );

    insert(_value: Leaf): void;

    update(_absoluteIndex: number, _value: Leaf): void;

    getLeaf(_index: number): Leaf;

    genMerkleSubrootPath(
      _absoluteStartIndex: number, // inclusive
      _absoluteEndIndex: number,
    ): MerkleProof;

    genMerklePath(_absoluteIndex: number): MerkleProof;

    static verifyMerklePath(_proof: MerkleProof, _hashFunc: (leaves: bigint[]) => bigint): boolean;

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

    constructor(_depth: number, _zeroValue: bigint, _leavesPerNode: number, _hashFunc: (leaves: bigint[]) => bigint);

    insert(_value: Leaf): void;

    update(_index: number, _value: Leaf): void;

    genMerklePath(_index: number): MerkleProof;

    genMerkleSubrootPath(
      _startIndex: number, // inclusive
      _endIndex: number,
    ): MerkleProof;

    static verifyMerklePath: (_proof: MerkleProof, _hashFunc: (leaves: bigint[]) => bigint) => boolean;

    getLeaf(_index: number): bigint;

    getNode(_index: number): bigint;

    setNode(_index: number, _value: bigint): void;

    private getChildIndices;

    static calcChildIndices(_index: number, _leavesPerNode: number, _depth: number): number[];

    private getParentIndices;

    static calcParentIndices(_index: number, _leavesPerNode: number, _depth: number): number[];

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
