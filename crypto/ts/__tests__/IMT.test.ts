import { expect } from "chai";

import { hash5 } from "../hashing";
import { IncrementalQuinTree } from "../quinTree";

describe("IMT comparison", () => {
  describe("constructor", () => {
    it("should calculate initial root and zero values", () => {
      const mt1 = new IncrementalQuinTree(5, 0n, 5, hash5);

      expect(mt1.root).to.not.eq(null);
      expect(mt1.zeros.length).to.be.gt(0);
    });
  });

  describe("insert", () => {
    it("should update the root after one insertion", () => {
      const mt1 = new IncrementalQuinTree(5, 0n, 5, hash5);

      const rootBefore = mt1.root;
      mt1.insert(1n);

      expect(mt1.root).to.not.eq(rootBefore);
    });
  });

  describe("genProof", () => {
    it("should generate a proof", () => {
      const mt1 = new IncrementalQuinTree(5, 0n, 5, hash5);

      mt1.insert(1n);

      const proof1 = mt1.genProof(0);

      expect(proof1.leaf).to.eq(mt1.getNode(0));
      expect(proof1.pathElements.length).to.be.gt(0);
      expect(proof1.pathIndices.length).to.be.gt(0);
      expect(proof1.root).to.eq(mt1.root);
    });

    it("should throw when trying to generate a proof for an index < 0", () => {
      const mt1 = new IncrementalQuinTree(5, 0n, 5, hash5);

      expect(() => mt1.genProof(-1)).to.throw("The leaf index must be greater or equal to 0");
    });

    it("should throw when trying to generate a proof for an index > tree size", () => {
      const mt1 = new IncrementalQuinTree(5, 0n, 5, hash5);

      const capacity = 5 ** 5;
      expect(() => mt1.genProof(capacity + 1)).to.throw("The leaf index must be less than the tree capacity");
    });
  });

  describe("genSubrootProof", () => {
    it("should geneate a valid proof for a subtree", () => {
      const mt1 = new IncrementalQuinTree(5, 0n, 5, hash5);

      for (let i = 0; i < 100; i += 1) {
        mt1.insert(BigInt(i));
      }

      const proof1 = mt1.genSubrootProof(5, 10);

      expect(mt1.verifyProof(proof1)).to.eq(true);
    });

    it("should throw when trying to generate a subroot proof and providing an end index > start index", () => {
      const mt1 = new IncrementalQuinTree(5, 0n, 5, hash5);

      expect(() => mt1.genSubrootProof(5, 4)).to.throw("The start index must be less than the end index");
    });

    it("should throw when providing a start index < 0", () => {
      const mt1 = new IncrementalQuinTree(5, 0n, 5, hash5);

      expect(() => mt1.genSubrootProof(-1, 5)).to.throw("The start index must be greater or equal to 0");
    });

    it("should throw when providing a leaves range not multiple of arity", () => {
      const arity = 5;
      const mt1 = new IncrementalQuinTree(arity, 0n, 5, hash5);

      expect(() => mt1.genSubrootProof(0, arity + 1)).to.throw(
        "The number of leaves must be a multiple of the tree arity",
      );
    });

    it("should throw when the number of leaves is larger than the capacity", () => {
      const arity = 5;
      const mt1 = new IncrementalQuinTree(arity, 0n, 5, hash5);

      expect(() => mt1.genSubrootProof(0, arity ** 5)).to.throw(
        "The number of leaves must be less than the tree capacity",
      );
    });
  });

  describe("verifyProof", () => {
    it("should validate a proof", () => {
      const mt1 = new IncrementalQuinTree(5, 0n, 5, hash5);

      mt1.insert(1n);

      const proof1 = mt1.genProof(0);

      expect(mt1.verifyProof(proof1)).to.eq(true);
    });
  });

  describe("calcParentIndices", () => {
    it("should throw when the index is out of bounds", () => {
      const arity = 5;
      const mt1 = new IncrementalQuinTree(arity, 0n, 5, hash5);

      expect(() => mt1.calcParentIndices(arity ** 5)).to.throw(
        `Index ${arity ** 5} is out of bounds. Can only get parents of leaves`,
      );
    });
  });

  describe("calcChildIndices", () => {
    it("should throw when the index is out of bounds", () => {
      const arity = 5;
      const mt1 = new IncrementalQuinTree(arity, 0n, 5, hash5);

      const index = 2;
      expect(() => mt1.calcChildIndices(index)).to.throw(
        `Index ${index} is out of bounds. Can only get children of subroots`,
      );
    });
  });

  describe("setNode", () => {
    it("should throw when trying to set the root directly", () => {
      const arity = 5;
      const mt1 = new IncrementalQuinTree(arity, 0n, 5, hash5);

      expect(() => {
        mt1.setNode(mt1.numNodes, 1n);
      }).to.throw("Index out of bounds");
    });

    it("should throw when the index is out of bounds", () => {
      const arity = 5;
      const mt1 = new IncrementalQuinTree(arity, 0n, 5, hash5);

      expect(() => {
        mt1.setNode(mt1.numNodes + 5, 1n);
      }).to.throw("Index out of bounds");
    });
  });

  describe("copy", () => {
    it("should produce a copy of the tree", () => {
      const arity = 5;
      const mt1 = new IncrementalQuinTree(arity, 0n, 5, hash5);

      const mt2 = mt1.copy();

      expect(mt2.root).to.eq(mt1.root);
      expect(mt2.zeros).to.deep.eq(mt1.zeros);
      expect(mt2.numNodes).to.eq(mt1.numNodes);
      expect(mt2.arity).to.eq(mt1.arity);
    });
  });
});
