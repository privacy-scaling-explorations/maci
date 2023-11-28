import { expect } from "chai";
import { AccQueue, IncrementalQuinTree, calcDepthFromNumLeaves } from "..";

/**
 * Test a full merge
 * @param SUB_DEPTH
 * @param HASH_LENGTH
 * @param ZERO
 * @param NUM_SUBTREES
 * @param MAIN_DEPTH
 */
export const testMerge = (
    SUB_DEPTH: number,
    HASH_LENGTH: number,
    ZERO: bigint,
    NUM_SUBTREES: number,
    MAIN_DEPTH: number
) => {
    //const hashFunc = HASH_LENGTH === 5 ? hash5 : hash2
    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
    const aq2 = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
    const tree = new IncrementalQuinTree(
        MAIN_DEPTH,
        ZERO,
        HASH_LENGTH,
        aq.hashFunc
    );

    for (let i = 0; i < NUM_SUBTREES; i++) {
        for (let j = 0; j < HASH_LENGTH ** SUB_DEPTH; j++) {
            const leaf = BigInt(j + 1);
            tree.insert(leaf);
            aq.enqueue(leaf);
            aq2.enqueue(leaf);
        }
    }

    // The main root should not exist yet
    expect(aq.hasRoot(MAIN_DEPTH)).to.be.false;
    expect(aq2.hasRoot(MAIN_DEPTH)).to.be.false;

    aq2.mergeSubRoots(0);
    aq2.merge(MAIN_DEPTH);

    // For reference only
    aq.mergeDirect(MAIN_DEPTH);

    // merge and mergeDirect should produce the same root
    expect(aq.hasRoot(MAIN_DEPTH)).to.be.true;
    expect(aq2.hasRoot(MAIN_DEPTH)).to.be.true;
    expect(aq.getRoot(MAIN_DEPTH).toString()).to.eq(
        aq2.getRoot(MAIN_DEPTH).toString()
    );

    // merge and mergeDirect should produce the correct root
    expect(aq.getRoot(MAIN_DEPTH).toString()).to.eq(tree.root.toString());
};

/**
 * Test merging the shortest subtree
 * @param SUB_DEPTH
 * @param HASH_LENGTH
 * @param ZERO
 * @param NUM_SUBTREES
 */
export const testMergeShortest = (
    SUB_DEPTH: number,
    HASH_LENGTH: number,
    ZERO: bigint,
    NUM_SUBTREES: number
) => {
    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
    const aq2 = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);

    for (let i = 0; i < NUM_SUBTREES; i++) {
        for (let j = 0; j < HASH_LENGTH ** SUB_DEPTH; j++) {
            const leaf = BigInt(j + 1);
            aq.enqueue(leaf);
            aq2.enqueue(leaf);
        }
    }

    // Merge all subroots in aq
    aq.mergeSubRoots(0);

    // Merge all but one subroot in aq2
    aq2.mergeSubRoots(2);
    expect(aq.smallSRTroot.toString()).not.to.eq(aq2.smallSRTroot.toString());
    aq2.mergeSubRoots(2);
    expect(aq.smallSRTroot.toString()).not.to.eq(aq2.smallSRTroot.toString());

    // Merge the last subroot in aq2
    aq2.mergeSubRoots(1);

    expect(aq.smallSRTroot.toString()).to.eq(aq2.smallSRTroot.toString());
};

/**
 * Insert one leaf, then run mergeSubRoots
 */
export const testMergeShortestOne = (
    SUB_DEPTH: number,
    HASH_LENGTH: number,
    ZERO: bigint
) => {
    const leaf = BigInt(123);
    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
    const smallTree = new IncrementalQuinTree(
        SUB_DEPTH,
        ZERO,
        HASH_LENGTH,
        aq.hashFunc
    );

    aq.enqueue(leaf);
    smallTree.insert(leaf);

    aq.mergeSubRoots(0);

    expect(aq.smallSRTroot.toString()).to.eq(smallTree.root.toString());
    expect(aq.getSubRoot(0).toString()).to.eq(smallTree.root.toString());
};

/**
 * Create a number of subtrees, and merge them all
 */
export const testMergeExhaustive = (
    SUB_DEPTH: number,
    HASH_LENGTH: number,
    ZERO: bigint,
    MAX: number
) => {
    for (let numSubtrees = 2; numSubtrees <= MAX; numSubtrees++) {
        const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);

        // Create numSubtrees subtrees
        for (let i = 0; i < numSubtrees; i++) {
            for (let j = 0; j < HASH_LENGTH ** SUB_DEPTH; j++) {
                const leaf = BigInt(j + 1);
                aq.enqueue(leaf);
            }
        }

        // Merge subroots
        aq.mergeSubRoots(0);

        const depth = calcDepthFromNumLeaves(HASH_LENGTH, numSubtrees);
        const smallTree = new IncrementalQuinTree(
            depth,
            aq.zeros[aq.subDepth],
            HASH_LENGTH,
            aq.hashFunc
        );
        for (let i = 0; i < aq.subRoots.length; i++) {
            smallTree.insert(aq.subRoots[i]);
        }
        expect(aq.smallSRTroot.toString()).to.eq(smallTree.root.toString());
    }
};
