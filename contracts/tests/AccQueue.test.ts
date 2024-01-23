import { expect } from "chai";
import { AccQueue, hashLeftRight, NOTHING_UP_MY_SLEEVE } from "maci-crypto";

import { AccQueue as AccQueueContract } from "../typechain-types";

import {
  deployTestAccQueues,
  fillGasLimit,
  enqueueGasLimit,
  testEmptySubtree,
  testEmptyUponDeployment,
  testEnqueue,
  testEnqueueAndInsertSubTree,
  testFillForAllIncompletes,
  testIncompleteSubtree,
  testInsertSubTrees,
  testMerge,
  testMergeAgain,
} from "./utils";

describe("AccQueues", () => {
  describe("Binary AccQueue enqueues", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);
    let aqContract: AccQueueContract;

    before(async () => {
      const r = await deployTestAccQueues("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aqContract = r.aqContract as AccQueueContract;
    });

    it("should be empty upon deployment", async () => {
      await testEmptyUponDeployment(aqContract);
    });

    it("should not be able to get a subroot that does not exist", async () => {
      await expect(aqContract.getSubRoot(5)).to.be.revertedWithCustomError(aqContract, "InvalidIndex");
    });

    it("should enqueue leaves", async () => {
      await testEnqueue(aqContract, HASH_LENGTH, SUB_DEPTH, ZERO);
    });
  });

  describe("Quinary AccQueue enqueues", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 5;
    const ZERO = BigInt(0);
    let aqContract: AccQueueContract;

    before(async () => {
      const r = await deployTestAccQueues("AccQueueQuinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aqContract = r.aqContract as AccQueueContract;
    });

    it("should be empty upon deployment", async () => {
      await testEmptyUponDeployment(aqContract);
    });

    it("should not be able to get a subroot that does not exist", async () => {
      await expect(aqContract.getSubRoot(5)).to.be.revertedWithCustomError(aqContract, "InvalidIndex");
    });

    it("should enqueue leaves", async () => {
      await testEnqueue(aqContract, HASH_LENGTH, SUB_DEPTH, ZERO);
    });
  });

  describe("Binary AccQueue0 fills", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);
    let aq: AccQueue;
    let aqContract: AccQueueContract;

    before(async () => {
      const r = await deployTestAccQueues("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aq = r.aq;
      aqContract = r.aqContract as AccQueueContract;
    });

    it("should fill an empty subtree", async () => {
      await testEmptySubtree(aq, aqContract, 0);
    });

    it("should fill an incomplete subtree", async () => {
      await testIncompleteSubtree(aq, aqContract);
    });

    it("Filling an empty subtree again should create the correct subroot", async () => {
      await testEmptySubtree(aq, aqContract, 2);
    });

    it("fill() should be correct for every number of leaves in an incomplete subtree", async () => {
      await testFillForAllIncompletes(aq, aqContract, HASH_LENGTH);
    });
  });

  describe("Quinary AccQueue0 fills", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 5;
    const ZERO = BigInt(0);
    let aq: AccQueue;
    let aqContract: AccQueueContract;

    before(async () => {
      const r = await deployTestAccQueues("AccQueueQuinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aq = r.aq;
      aqContract = r.aqContract as AccQueueContract;
    });

    it("should fill an empty subtree", async () => {
      await testEmptySubtree(aq, aqContract, 0);
    });

    it("should fill an incomplete subtree", async () => {
      await testIncompleteSubtree(aq, aqContract);
    });

    it("Filling an empty subtree again should create the correct subroot", async () => {
      await testEmptySubtree(aq, aqContract, 2);
    });

    it("fill() should be correct for every number of leaves in an incomplete subtree", async () => {
      await testFillForAllIncompletes(aq, aqContract, HASH_LENGTH);
    });
  });

  describe("Binary AccQueueMaci fills", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 2;
    const ZERO = NOTHING_UP_MY_SLEEVE;
    let aq: AccQueue;
    let aqContract: AccQueueContract;

    before(async () => {
      const r = await deployTestAccQueues("AccQueueBinaryMaci", SUB_DEPTH, HASH_LENGTH, ZERO);
      aq = r.aq;
      aqContract = r.aqContract as AccQueueContract;
    });

    it("should fill an empty subtree", async () => {
      await testEmptySubtree(aq, aqContract, 0);
    });

    it("should fill an incomplete subtree", async () => {
      await testIncompleteSubtree(aq, aqContract);
    });

    it("Filling an empty subtree again should create the correct subroot", async () => {
      await testEmptySubtree(aq, aqContract, 2);
    });

    it("fill() should be correct for every number of leaves in an incomplete subtree", async () => {
      await testFillForAllIncompletes(aq, aqContract, HASH_LENGTH);
    });
  });

  describe("Quinary AccQueueMaci fills", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 5;
    const ZERO = NOTHING_UP_MY_SLEEVE;
    let aq: AccQueue;
    let aqContract: AccQueueContract;

    before(async () => {
      const r = await deployTestAccQueues("AccQueueQuinaryMaci", SUB_DEPTH, HASH_LENGTH, ZERO);
      aq = r.aq;
      aqContract = r.aqContract as AccQueueContract;
    });

    it("should fill an empty subtree", async () => {
      await testEmptySubtree(aq, aqContract, 0);
    });

    it("should fill an incomplete subtree", async () => {
      await testIncompleteSubtree(aq, aqContract);
    });

    it("Filling an empty subtree again should create the correct subroot", async () => {
      await testEmptySubtree(aq, aqContract, 2);
    });

    it("fill() should be correct for every number of leaves in an incomplete subtree", async () => {
      await testFillForAllIncompletes(aq, aqContract, HASH_LENGTH);
    });
  });

  describe("Merge after enqueuing more leaves", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);
    const MAIN_DEPTH = 3;

    it("should produce the correct main roots", async () => {
      const r = await deployTestAccQueues("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      await testMergeAgain(r.aq, r.aqContract as AccQueueContract, MAIN_DEPTH);
    });
  });

  describe("Edge cases", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);

    it("should not be possible to merge into a tree of depth 0", async () => {
      const r = await deployTestAccQueues("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);

      const aqContract = r.aqContract as AccQueueContract;
      await aqContract.enqueue(1).then((tx) => tx.wait());
      await aqContract.mergeSubRoots(0, { gasLimit: 1000000 }).then((tx) => tx.wait());
      await expect(aqContract.merge(0, { gasLimit: 1000000 })).to.revertedWithCustomError(
        aqContract,
        "DepthCannotBeZero",
      );
    });

    it("A small SRT of depth 1 should just have 2 leaves", async () => {
      const r = await deployTestAccQueues("AccQueueBinary0", 1, HASH_LENGTH, ZERO);

      const aqContract = r.aqContract as AccQueueContract;
      await aqContract.enqueue(0, enqueueGasLimit).then((tx) => tx.wait());
      await aqContract.mergeSubRoots(0, { gasLimit: 1000000 }).then((tx) => tx.wait());
      const srtRoot = await aqContract.getSmallSRTroot();
      const expectedRoot = hashLeftRight(BigInt(0), BigInt(0));
      expect(srtRoot.toString()).to.eq(expectedRoot.toString());
    });

    it("should not be possible to merge subroots into a tree shorter than the SRT depth", async () => {
      const r = await deployTestAccQueues("AccQueueBinary0", 1, HASH_LENGTH, ZERO);
      const aqContract = r.aqContract as AccQueueContract;
      for (let i = 0; i < 4; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await aqContract.fill(fillGasLimit).then((tx) => tx.wait());
      }

      await aqContract.mergeSubRoots(0, { gasLimit: 1000000 }).then((tx) => tx.wait());

      await expect(aqContract.merge(1, { gasLimit: 1000000 })).to.be.revertedWithCustomError(
        aqContract,
        "DepthTooSmall",
      );
    });

    it("Merging without enqueing new data should not change the root", async () => {
      const MAIN_DEPTH = 5;

      const r = await deployTestAccQueues("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);

      const { aq } = r;
      const aqContract = r.aqContract as AccQueueContract;
      // Merge once
      await testMerge(aq, aqContract, 1, MAIN_DEPTH);
      // Get the root
      const expectedMainRoot = (await aqContract.getMainRoot(MAIN_DEPTH)).toString();
      // Merge again
      await aqContract.merge(MAIN_DEPTH, { gasLimit: 8000000 }).then((tx) => tx.wait());
      // Get the root again
      const root = (await aqContract.getMainRoot(MAIN_DEPTH)).toString();
      // Check that the roots match
      expect(root).to.eq(expectedMainRoot);
    });
  });

  describe("Binary AccQueue0 one-shot merges", () => {
    const SUB_DEPTH = 2;
    const MAIN_DEPTH = 5;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);

    const testParams = [1, 2, 3, 4];
    testParams.forEach((testParam) => {
      it(`should merge ${testParam} subtrees`, async () => {
        const r = await deployTestAccQueues("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
        const { aq } = r;
        const aqContract = r.aqContract as AccQueueContract;
        await testMerge(aq, aqContract, testParam, MAIN_DEPTH);
      });
    });
  });

  describe("Quinary AccQueue0 one-shot merges", () => {
    const SUB_DEPTH = 2;
    const MAIN_DEPTH = 6;
    const HASH_LENGTH = 5;
    const ZERO = BigInt(0);

    const testParams = [1, 5, 26];
    testParams.forEach((testParam) => {
      it(`should merge ${testParam} subtrees`, async () => {
        const r = await deployTestAccQueues("AccQueueQuinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
        const { aq } = r;
        const aqContract = r.aqContract as AccQueueContract;
        await testMerge(aq, aqContract, testParam, MAIN_DEPTH);
      });
    });
  });

  describe("Binary AccQueue0 subtree insertions", () => {
    const SUB_DEPTH = 2;
    const MAIN_DEPTH = 6;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);

    it("Enqueued leaves and inserted subtrees should be in the right order", async () => {
      const r = await deployTestAccQueues("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      const { aq } = r;
      const aqContract = r.aqContract as AccQueueContract;
      await testEnqueueAndInsertSubTree(aq, aqContract);
    });

    const testParams = [1, 2, 3, 9];
    testParams.forEach((testParam) => {
      it(`should insert ${testParam} subtrees`, async () => {
        const r = await deployTestAccQueues("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
        const { aq } = r;
        const aqContract = r.aqContract as AccQueueContract;
        await testInsertSubTrees(aq, aqContract, testParam, MAIN_DEPTH);
      });
    });
  });

  describe("Quinary AccQueue0 subtree insertions", () => {
    const SUB_DEPTH = 2;
    const MAIN_DEPTH = 6;
    const HASH_LENGTH = 5;
    const ZERO = BigInt(0);

    it("Enqueued leaves and inserted subtrees should be in the right order", async () => {
      const r = await deployTestAccQueues("AccQueueQuinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      const { aq } = r;
      const aqContract = r.aqContract as AccQueueContract;
      await testEnqueueAndInsertSubTree(aq, aqContract);
    });

    const testParams = [1, 4, 9, 26];
    testParams.forEach((testParam) => {
      it(`should insert ${testParam} subtrees`, async () => {
        const r = await deployTestAccQueues("AccQueueQuinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
        const { aq } = r;
        const aqContract = r.aqContract as AccQueueContract;
        await testInsertSubTrees(aq, aqContract, testParam, MAIN_DEPTH);
      });
    });
  });

  describe("Binary AccQueue0 progressive merges", () => {
    const SUB_DEPTH = 2;
    const MAIN_DEPTH = 5;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);
    const NUM_SUBTREES = 5;
    let aq: AccQueue;
    let aqContract: AccQueueContract;

    before(async () => {
      const r = await deployTestAccQueues("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aq = r.aq;
      aqContract = r.aqContract as AccQueueContract;
    });

    it(`should progressively merge ${NUM_SUBTREES} subtrees`, async () => {
      for (let i = 0; i < NUM_SUBTREES; i += 1) {
        const leaf = BigInt(123);
        // eslint-disable-next-line no-await-in-loop
        await aqContract.enqueue(leaf.toString(), enqueueGasLimit).then((tx) => tx.wait());
        aq.enqueue(leaf);

        aq.fill();
        // eslint-disable-next-line no-await-in-loop
        await aqContract.fill(fillGasLimit).then((tx) => tx.wait());
      }

      aq.mergeSubRoots(0);
      const expectedSmallSRTroot = aq.getSmallSRTroot();

      await expect(aqContract.getSmallSRTroot()).to.be.revertedWithCustomError(aqContract, "SubTreesNotMerged");

      await aqContract.mergeSubRoots(2).then((tx) => tx.wait());
      await aqContract.mergeSubRoots(2).then((tx) => tx.wait());
      await aqContract.mergeSubRoots(1).then((tx) => tx.wait());

      const contractSmallSRTroot = await aqContract.getSmallSRTroot();
      expect(expectedSmallSRTroot.toString()).to.eq(contractSmallSRTroot.toString());

      aq.merge(MAIN_DEPTH);
      await (await aqContract.merge(MAIN_DEPTH)).wait();

      const expectedMainRoot = aq.getMainRoots()[MAIN_DEPTH];
      const contractMainRoot = await aqContract.getMainRoot(MAIN_DEPTH);

      expect(expectedMainRoot.toString()).to.eq(contractMainRoot.toString());
    });
  });

  describe("Quinary AccQueue0 progressive merges", () => {
    const SUB_DEPTH = 2;
    const MAIN_DEPTH = 5;
    const HASH_LENGTH = 5;
    const ZERO = BigInt(0);
    const NUM_SUBTREES = 6;
    let aq: AccQueue;
    let aqContract: AccQueueContract;

    before(async () => {
      const r = await deployTestAccQueues("AccQueueQuinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aq = r.aq;
      aqContract = r.aqContract as AccQueueContract;
    });

    it(`should progressively merge ${NUM_SUBTREES} subtrees`, async () => {
      for (let i = 0; i < NUM_SUBTREES; i += 1) {
        const leaf = BigInt(123);
        // eslint-disable-next-line no-await-in-loop
        await aqContract.enqueue(leaf.toString(), enqueueGasLimit).then((tx) => tx.wait());
        aq.enqueue(leaf);

        aq.fill();
        // eslint-disable-next-line no-await-in-loop
        await aqContract.fill(fillGasLimit).then((tx) => tx.wait());
      }

      aq.mergeSubRoots(0);
      const expectedSmallSRTroot = aq.getSmallSRTroot();

      await expect(aqContract.getSmallSRTroot()).to.be.revertedWithCustomError(aqContract, "SubTreesNotMerged");

      await (await aqContract.mergeSubRoots(2)).wait();
      await (await aqContract.mergeSubRoots(2)).wait();
      await (await aqContract.mergeSubRoots(2)).wait();

      const contractSmallSRTroot = await aqContract.getSmallSRTroot();
      expect(expectedSmallSRTroot.toString()).to.eq(contractSmallSRTroot.toString());

      aq.merge(MAIN_DEPTH);
      await (await aqContract.merge(MAIN_DEPTH)).wait();

      const expectedMainRoot = aq.getMainRoots()[MAIN_DEPTH];
      const contractMainRoot = await aqContract.getMainRoot(MAIN_DEPTH);

      expect(expectedMainRoot.toString()).to.eq(contractMainRoot.toString());
    });
  });

  describe("Conditions that cause merge() to revert", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);
    const NUM_SUBTREES = 1;
    let aqContract: AccQueueContract;

    before(async () => {
      const r = await deployTestAccQueues("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aqContract = r.aqContract as AccQueueContract;
    });

    it("mergeSubRoots() should fail on an empty AccQueue", async () => {
      await expect(aqContract.mergeSubRoots(0, { gasLimit: 1000000 })).to.be.revertedWithCustomError(
        aqContract,
        "NothingToMerge",
      );
    });

    it("merge() should revert on an empty AccQueue", async () => {
      await expect(aqContract.merge(1, { gasLimit: 1000000 })).to.be.revertedWithCustomError(
        aqContract,
        "SubTreesNotMerged",
      );
    });

    it(`merge() should revert if there are unmerged subtrees`, async () => {
      for (let i = 0; i < NUM_SUBTREES; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await aqContract.fill(fillGasLimit).then((tx) => tx.wait());
      }

      await expect(aqContract.merge(1)).to.be.revertedWithCustomError(aqContract, "SubTreesNotMerged");
    });

    it(`merge() should revert if the desired depth is invalid`, async () => {
      await aqContract.mergeSubRoots(0, { gasLimit: 1000000 }).then((tx) => tx.wait());

      await expect(aqContract.merge(0, { gasLimit: 1000000 })).to.be.revertedWithCustomError(
        aqContract,
        "DepthCannotBeZero",
      );
    });
  });
});
