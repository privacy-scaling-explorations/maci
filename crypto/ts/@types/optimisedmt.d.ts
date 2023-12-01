declare module "optimisedmt" {
  export class OptimisedMT {
    root: bigint;

    nextIndex: number;

    zeroValue: bigint;

    constructor(depth: number, root: bigint, degree: number, hash: (elements: bigint[]) => bigint);

    static verifyMerklePath(elements: { pathElements: bigint[] }, hash: (elements: bigint[]) => bigint): boolean;

    hashFunc(elements: bigint[]): bigint;

    insert(leaf: bigint): void;

    copy(): OptimisedMT;

    update(index: number, leaf: bigint): void;

    genMerkleSubrootPath(start: number, end: number): { pathElements: bigint[] };

    genMerklePath(index: number): { pathElements: bigint[] };
  }
}
