import { expect } from "chai";
import { IncrementalQuinTree, AccQueue } from "../";
import {
    testMerge,
    testMergeExhaustive,
    testMergeShortest,
    testMergeShortestOne,
} from "./utils";

describe("AccQueue", function () {
    this.timeout(100000);
    describe("Enqueue", () => {
        describe("Binary AccQueue", () => {
            const HASH_LENGTH = 2;
            const SUB_DEPTH = 2;
            const ZERO = BigInt(0);

            const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);

            it("Should enqueue leaves into a subtree", async () => {
                const tree0 = new IncrementalQuinTree(
                    SUB_DEPTH,
                    ZERO,
                    HASH_LENGTH,
                    aq.hashFunc
                );

                const subtreeCapacity = HASH_LENGTH ** SUB_DEPTH;
                for (let i = 0; i < subtreeCapacity; i++) {
                    const leaf = BigInt(i + 1);
                    tree0.insert(leaf);
                    aq.enqueue(leaf);
                }
                expect(aq.getSubRoot(0).toString()).to.eq(
                    tree0.root.toString()
                );
            });

            it("Should enqueue another subtree", async () => {
                const tree1 = new IncrementalQuinTree(
                    SUB_DEPTH,
                    ZERO,
                    HASH_LENGTH,
                    aq.hashFunc
                );

                const subtreeCapacity = HASH_LENGTH ** SUB_DEPTH;
                for (let i = 0; i < subtreeCapacity; i++) {
                    const leaf = BigInt(i + 1);
                    tree1.insert(leaf);
                    aq.enqueue(leaf);
                }
                expect(aq.getSubRoot(1).toString()).to.eq(
                    tree1.root.toString()
                );
            });
        });

        describe("Quinary AccQueue", () => {
            const HASH_LENGTH = 5;
            const SUB_DEPTH = 2;
            const ZERO = BigInt(0);

            const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);

            it("Should enqueue leaves into a subtree", async () => {
                const tree0 = new IncrementalQuinTree(
                    SUB_DEPTH,
                    ZERO,
                    HASH_LENGTH,
                    aq.hashFunc
                );

                const subtreeCapacity = HASH_LENGTH ** SUB_DEPTH;
                for (let i = 0; i < subtreeCapacity; i++) {
                    const leaf = BigInt(i + 1);
                    tree0.insert(leaf);
                    aq.enqueue(leaf);
                }
                expect(aq.getSubRoot(0).toString()).to.eq(
                    tree0.root.toString()
                );

                const tree1 = new IncrementalQuinTree(
                    SUB_DEPTH,
                    ZERO,
                    HASH_LENGTH,
                    aq.hashFunc
                );

                for (let i = 0; i < subtreeCapacity; i++) {
                    const leaf = BigInt(i + 1);
                    tree1.insert(leaf);
                    aq.enqueue(leaf);
                }
                expect(aq.getSubRoot(1).toString()).to.eq(
                    tree1.root.toString()
                );
            });
        });
    });

    describe("Fill", () => {
        describe("Binary AccQueue", () => {
            const HASH_LENGTH = 2;
            const SUB_DEPTH = 2;
            const ZERO = BigInt(0);

            it("Filling an empty subtree should create the correct subroot", () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
                const tree = new IncrementalQuinTree(
                    SUB_DEPTH,
                    ZERO,
                    HASH_LENGTH,
                    aq.hashFunc
                );
                aq.fill();
                expect(aq.getSubRoot(0).toString()).to.eq(tree.root.toString());
            });

            it("Should fill an incomplete subtree", () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
                const tree = new IncrementalQuinTree(
                    SUB_DEPTH,
                    ZERO,
                    HASH_LENGTH,
                    aq.hashFunc
                );

                const leaf = BigInt(1);
                aq.enqueue(leaf);
                tree.insert(leaf);

                aq.fill();

                expect(aq.getSubRoot(0).toString()).to.eq(tree.root.toString());
            });

            it("Filling an empty subtree again should create the correct subroot", () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
                const leaf = BigInt(1);

                // Create the first subtree with one leaf
                aq.enqueue(leaf);
                aq.fill();

                // Fill the second subtree with zeros
                aq.fill();
                const tree = new IncrementalQuinTree(
                    SUB_DEPTH,
                    ZERO,
                    HASH_LENGTH,
                    aq.hashFunc
                );
                expect(aq.getSubRoot(1).toString()).to.eq(tree.root.toString());
            });

            it("fill() should be correct for every number of leaves in an incomplete subtree", () => {
                for (let i = 0; i < 2; i++) {
                    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
                    const tree = new IncrementalQuinTree(
                        SUB_DEPTH,
                        ZERO,
                        HASH_LENGTH,
                        aq.hashFunc
                    );
                    for (let j = 0; j < i; j++) {
                        const leaf = BigInt(i + 1);
                        aq.enqueue(leaf);
                        tree.insert(leaf);
                    }
                    aq.fill();

                    expect(aq.getSubRoot(0).toString()).to.eq(
                        tree.root.toString()
                    );
                }
            });
        });

        describe("Quinary AccQueue", () => {
            const HASH_LENGTH = 5;
            const SUB_DEPTH = 2;
            const ZERO = BigInt(0);

            it("Filling an empty subtree should create the correct subroot", () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
                const tree = new IncrementalQuinTree(
                    SUB_DEPTH,
                    ZERO,
                    HASH_LENGTH,
                    aq.hashFunc
                );
                aq.fill();
                expect(aq.getSubRoot(0).toString()).to.eq(tree.root.toString());
            });

            it("Should fill one incomplete subtree", () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
                const tree = new IncrementalQuinTree(
                    SUB_DEPTH,
                    ZERO,
                    HASH_LENGTH,
                    aq.hashFunc
                );

                const leaf = BigInt(1);
                aq.enqueue(leaf);
                tree.insert(leaf);

                aq.fill();

                expect(aq.getSubRoot(0).toString()).to.eq(tree.root.toString());
            });

            it("Filling an empty subtree again should create the correct subroot", () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
                const leaf = BigInt(1);

                // Create the first subtree with one leaf
                aq.enqueue(leaf);
                aq.fill();

                // Fill the second subtree with zeros
                aq.fill();
                const tree = new IncrementalQuinTree(
                    SUB_DEPTH,
                    ZERO,
                    HASH_LENGTH,
                    aq.hashFunc
                );
                expect(aq.getSubRoot(1).toString()).to.eq(tree.root.toString());
            });

            it("fill() should be correct for every number of leaves in an incomplete subtree", () => {
                const capacity = HASH_LENGTH ** SUB_DEPTH;
                for (let i = 1; i < capacity - 1; i++) {
                    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
                    const tree = new IncrementalQuinTree(
                        SUB_DEPTH,
                        ZERO,
                        HASH_LENGTH,
                        aq.hashFunc
                    );
                    for (let j = 0; j < i; j++) {
                        const leaf = BigInt(i + 1);
                        aq.enqueue(leaf);
                        tree.insert(leaf);
                    }
                    aq.fill();

                    expect(aq.getSubRoot(0).toString()).to.eq(
                        tree.root.toString()
                    );
                }
            });
        });
    });

    describe("Merge", () => {
        const SUB_DEPTH = 2;
        const ZERO = BigInt(0);
        const NUM_SUBTREES = 5;
        const MAIN_DEPTH = 5;

        describe("Binary AccQueue", () => {
            const HASH_LENGTH = 2;

            describe("merge()", () => {
                it("Should produce the correct main root", () => {
                    testMerge(
                        SUB_DEPTH,
                        HASH_LENGTH,
                        ZERO,
                        NUM_SUBTREES,
                        MAIN_DEPTH
                    );
                });
            });

            describe("mergeSubRoots()", () => {
                it("Should work progressively", () => {
                    testMergeShortest(
                        SUB_DEPTH,
                        HASH_LENGTH,
                        ZERO,
                        NUM_SUBTREES
                    );
                });

                it("Should fail if there are 0 leaves", () => {
                    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
                    expect(() => {
                        aq.mergeSubRoots(0);
                    }).to.throw;
                });

                it("Should a generate the same smallMainTreeRoot root from 1 subroot", () => {
                    testMergeShortestOne(SUB_DEPTH, HASH_LENGTH, ZERO);
                });

                it("Exhaustive test from 2 to 16 subtrees", () => {
                    const MAX = 16;
                    testMergeExhaustive(SUB_DEPTH, HASH_LENGTH, ZERO, MAX);
                });
            });
        });

        describe("Quinary AccQueue", () => {
            const HASH_LENGTH = 5;

            describe("merge()", () => {
                it("Should produce the correct main root", () => {
                    testMerge(
                        SUB_DEPTH,
                        HASH_LENGTH,
                        ZERO,
                        NUM_SUBTREES,
                        MAIN_DEPTH
                    );
                });
            });

            describe("mergeSubRoots()", () => {
                it("Should work progressively", () => {
                    testMergeShortest(
                        SUB_DEPTH,
                        HASH_LENGTH,
                        ZERO,
                        NUM_SUBTREES
                    );
                });

                it("Should fail if there are 0 leaves", () => {
                    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
                    expect(() => {
                        aq.mergeSubRoots(0);
                    }).to.throw;
                });

                it("Should a generate the same smallMainTreeRoot root from 1 subroot", () => {
                    testMergeShortestOne(SUB_DEPTH, HASH_LENGTH, ZERO);
                });

                it("Exhaustive test from 2 to 16 subtrees", () => {
                    const MAX = 16;
                    testMergeExhaustive(SUB_DEPTH, HASH_LENGTH, ZERO, MAX);
                });
            });
        });
    });
});
