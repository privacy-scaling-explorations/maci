// Mock for @openzeppelin/merkle-tree to avoid util.deprecate issues in tests
export class StandardMerkleTree {
  static of = jest.fn();

  static from = jest.fn();

  static verify = jest.fn();

  static load = jest.fn();

  getProof = jest.fn();

  verify = jest.fn();

  render = jest.fn();

  dump = jest.fn();
}
