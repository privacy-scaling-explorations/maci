declare module '@zk-kit/lean-imt' {
  export class IncrementalQuinTree {
    constructor(depth: number, zeroValue: bigint, arity: number, hashFunction: (inputs: bigint[]) => bigint);
    insert(value: bigint): void;
    genProof(index: number): { pathElements: bigint[] };
  }
} 