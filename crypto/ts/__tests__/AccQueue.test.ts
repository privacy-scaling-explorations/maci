import {
    IncrementalQuinTree,
    AccQueue,
} from '../'

const calcDepthFromNumLeaves = (
    hashLength: number,
    numLeaves: number,
) => {

    let depth = 1
    while (true) {
        const max = hashLength ** depth
        if (BigInt(max) >= numLeaves) {
            break
        }
        depth ++
    }

    return depth
}

const testMerge = (
    SUB_DEPTH: number,
    HASH_LENGTH: number,
    ZERO: BigInt,
    NUM_SUBTREES: number,
    MAIN_DEPTH: number,
) => {
    //const hashFunc = HASH_LENGTH === 5 ? hash5 : hash2
    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
    const aq2 = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
    const tree = new IncrementalQuinTree(MAIN_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)

    for (let i = 0; i < NUM_SUBTREES; i ++) {
        for (let j = 0; j < HASH_LENGTH ** SUB_DEPTH; j ++) {
            const leaf = BigInt(j + 1)
            tree.insert(leaf)
            aq.enqueue(leaf)
            aq2.enqueue(leaf)
        }
    }

    // The main root should not exist yet
    expect(aq.hasRoot(MAIN_DEPTH)).toBeFalsy()
    expect(aq2.hasRoot(MAIN_DEPTH)).toBeFalsy()

    aq2.mergeSubRoots(0)
    aq2.merge(MAIN_DEPTH)

    // For reference only
    aq.mergeDirect(MAIN_DEPTH)

    // merge and mergeDirect should produce the same root
    expect(aq.hasRoot(MAIN_DEPTH)).toBeTruthy()
    expect(aq2.hasRoot(MAIN_DEPTH)).toBeTruthy()
    expect(aq.getRoot(MAIN_DEPTH).toString())
        .toEqual(aq2.getRoot(MAIN_DEPTH).toString())

    // merge and mergeDirect should produce the correct root
    expect(aq.getRoot(MAIN_DEPTH).toString()).toEqual(tree.root.toString())
}

const testMergeShortest = (
    SUB_DEPTH: number,
    HASH_LENGTH: number,
    ZERO: BigInt,
    NUM_SUBTREES: number,
) => {
    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
    const aq2 = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)

    for (let i = 0; i < NUM_SUBTREES; i ++) {
        for (let j = 0; j < HASH_LENGTH ** SUB_DEPTH; j ++) {
            const leaf = BigInt(j + 1)
            aq.enqueue(leaf)
            aq2.enqueue(leaf)
        }
    }

    // Merge all subroots in aq
    aq.mergeSubRoots(0)

    // Merge all but one subroot in aq2
    aq2.mergeSubRoots(2)
    expect(aq.smallSRTroot.toString()).not.toEqual(aq2.smallSRTroot.toString())
    aq2.mergeSubRoots(2)
    expect(aq.smallSRTroot.toString()).not.toEqual(aq2.smallSRTroot.toString())

    // Merge the last subroot in aq2
    aq2.mergeSubRoots(1)

    expect(aq.smallSRTroot.toString()).toEqual(aq2.smallSRTroot.toString())
}

/*
 * Insert one leaf, then run mergeSubRoots
 */
const testMergeShortestOne = (
    SUB_DEPTH: number,
    HASH_LENGTH: number,
    ZERO: BigInt,
) => {
    const leaf = BigInt(123)
    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
    const smallTree = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)

    aq.enqueue(leaf)
    smallTree.insert(leaf)

    aq.mergeSubRoots(0)

    expect(aq.smallSRTroot.toString()).toEqual(smallTree.root.toString())
    expect(aq.getSubRoot(0).toString()).toEqual(smallTree.root.toString())
}

/*
 * Create a number of subtrees, and merge them all
 */
const testMergeExhaustive = (
    SUB_DEPTH: number,
    HASH_LENGTH: number,
    ZERO: BigInt,
    MAX: number,
) => {
    for (let numSubtrees = 2; numSubtrees <= MAX; numSubtrees ++) {
        const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)

        // Create numSubtrees subtrees
        for (let i = 0; i < numSubtrees; i ++) {
            for (let j = 0; j < HASH_LENGTH ** SUB_DEPTH; j ++) {
                const leaf = BigInt(j + 1)
                aq.enqueue(leaf)
            }
        }

        // Merge subroots
        aq.mergeSubRoots(0)

        const depth = calcDepthFromNumLeaves(HASH_LENGTH, numSubtrees)
        const smallTree = new IncrementalQuinTree(depth, aq.zeros[aq.subDepth], HASH_LENGTH, aq.hashFunc)
        for (let i = 0; i < aq.subRoots.length; i++) {
            smallTree.insert(aq.subRoots[i])
        }
        expect(aq.smallSRTroot.toString()).toEqual(smallTree.root.toString())
    }
}

describe('AccQueue', () => {
    describe('Enqueue', () => {
        describe('Binary AccQueue', () => {
            const HASH_LENGTH = 2
            const SUB_DEPTH = 2
            const ZERO = BigInt(0)

            const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)

            it('Should enqueue leaves into a subtree', async () => {
                const tree0 = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)

                const subtreeCapacity = HASH_LENGTH ** SUB_DEPTH
                for (let i = 0; i < subtreeCapacity; i ++) {
                    const leaf = BigInt(i + 1)
                    tree0.insert(leaf)
                    aq.enqueue(leaf)
                }
                expect(aq.getSubRoot(0).toString()).toEqual(tree0.root.toString())
            })

            it('Should enqueue another subtree', async () => {
                const tree1 = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)

                const subtreeCapacity = HASH_LENGTH ** SUB_DEPTH
                for (let i = 0; i < subtreeCapacity; i ++) {
                    const leaf = BigInt(i + 1)
                    tree1.insert(leaf)
                    aq.enqueue(leaf)
                }
                expect(aq.getSubRoot(1).toString()).toEqual(tree1.root.toString())
            })
        })

        describe('Quinary AccQueue', () => {
            const HASH_LENGTH = 5
            const SUB_DEPTH = 2
            const ZERO = BigInt(0)

            const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)

            it('Should enqueue leaves into a subtree', async () => {
                const tree0 = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)

                const subtreeCapacity = HASH_LENGTH ** SUB_DEPTH
                for (let i = 0; i < subtreeCapacity; i ++) {
                    const leaf = BigInt(i + 1)
                    tree0.insert(leaf)
                    aq.enqueue(leaf)
                }
                expect(aq.getSubRoot(0).toString()).toEqual(tree0.root.toString())

                const tree1 = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)

                for (let i = 0; i < subtreeCapacity; i ++) {
                    const leaf = BigInt(i + 1)
                    tree1.insert(leaf)
                    aq.enqueue(leaf)
                }
                expect(aq.getSubRoot(1).toString()).toEqual(tree1.root.toString())
            })

        })
    })

    describe('Fill', () => {
        describe('Binary AccQueue', () => {
            const HASH_LENGTH = 2
            const SUB_DEPTH = 2
            const ZERO = BigInt(0)

            it('Filling an empty subtree should create the correct subroot', () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
                const tree = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)
                aq.fill()
                expect(aq.getSubRoot(0).toString()).toEqual(tree.root.toString())
            })

            it('Should fill an incomplete subtree', () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
                const tree = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)

                const leaf = BigInt(1)
                aq.enqueue(leaf)
                tree.insert(leaf)

                aq.fill()

                expect(aq.getSubRoot(0).toString()).toEqual(tree.root.toString())
            })

            it('Filling an empty subtree again should create the correct subroot', () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
                const leaf = BigInt(1)

                // Create the first subtree with one leaf
                aq.enqueue(leaf)
                aq.fill()
                
                // Fill the second subtree with zeros
                aq.fill()
                const tree = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)
                expect(aq.getSubRoot(1).toString()).toEqual(tree.root.toString())
            })

            it('fill() should be correct for every number of leaves in an incomplete subtree', () => {
                for (let i = 0; i < 2; i ++) {
                    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
                    const tree = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)
                    for (let j = 0; j < i; j ++) {
                        const leaf = BigInt(i + 1)
                        aq.enqueue(leaf)
                        tree.insert(leaf)
                    }
                    aq.fill()

                    expect(aq.getSubRoot(0).toString()).toEqual(tree.root.toString())
                }

            })
        })

        describe('Quinary AccQueue', () => {
            const HASH_LENGTH = 5
            const SUB_DEPTH = 2
            const ZERO = BigInt(0)

            it('Filling an empty subtree should create the correct subroot', () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
                const tree = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)
                aq.fill()
                expect(aq.getSubRoot(0).toString()).toEqual(tree.root.toString())
            })

            it('Should fill one incomplete subtree', () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
                const tree = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)

                const leaf = BigInt(1)
                aq.enqueue(leaf)
                tree.insert(leaf)

                aq.fill()

                expect(aq.getSubRoot(0).toString()).toEqual(tree.root.toString())
            })

            it('Filling an empty subtree again should create the correct subroot', () => {
                const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
                const leaf = BigInt(1)

                // Create the first subtree with one leaf
                aq.enqueue(leaf)
                aq.fill()
                
                // Fill the second subtree with zeros
                aq.fill()
                const tree = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)
                expect(aq.getSubRoot(1).toString()).toEqual(tree.root.toString())
            })

            it('fill() should be correct for every number of leaves in an incomplete subtree', () => {
                const capacity = HASH_LENGTH ** SUB_DEPTH
                for (let i = 1; i < capacity - 1; i ++) {
                    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
                    const tree = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, aq.hashFunc)
                    for (let j = 0; j < i; j ++) {
                        const leaf = BigInt(i + 1)
                        aq.enqueue(leaf)
                        tree.insert(leaf)
                    }
                    aq.fill()

                    expect(aq.getSubRoot(0).toString()).toEqual(tree.root.toString())
                }
            })
        })
    })

    describe('Merge', () => {
        const SUB_DEPTH = 2
        const ZERO = BigInt(0)
        const NUM_SUBTREES = 5
        const MAIN_DEPTH = 5

        describe('Binary AccQueue', () => {
            const HASH_LENGTH = 2

            describe('merge()', () => {
                it('Should produce the correct main root', () => {
                    testMerge(SUB_DEPTH, HASH_LENGTH, ZERO, NUM_SUBTREES, MAIN_DEPTH)
                })
            })

            describe('mergeSubRoots()', () => {
                it('Should work progressively', () => {
                    testMergeShortest(SUB_DEPTH, HASH_LENGTH, ZERO, NUM_SUBTREES)
                })

                it('Should fail if there are 0 leaves', () => {
                    expect.assertions(1)
                    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
                    expect(() => { aq.mergeSubRoots(0) }).toThrow()
                })

                it('Should a generate the same smallMainTreeRoot root from 1 subroot', () => {
                    testMergeShortestOne(SUB_DEPTH, HASH_LENGTH, ZERO)
                })

                it('Exhaustive test from 2 to 16 subtrees', () => {
                    const MAX = 16
                    testMergeExhaustive(SUB_DEPTH, HASH_LENGTH, ZERO, MAX)
                })
            })
        })

        describe('Quinary AccQueue', () => {
            const HASH_LENGTH = 5

            describe('merge()', () => {
                it('Should produce the correct main root', () => {
                    testMerge(SUB_DEPTH, HASH_LENGTH, ZERO, NUM_SUBTREES, MAIN_DEPTH)
                })
            })

            describe('mergeSubRoots()', () => {
                it('Should work progressively', () => {
                    testMergeShortest(SUB_DEPTH, HASH_LENGTH, ZERO, NUM_SUBTREES)
                })

                it('Should fail if there are 0 leaves', () => {
                    expect.assertions(1)
                    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
                    expect(() => { aq.mergeSubRoots(0) }).toThrow()
                })

                it('Should a generate the same smallMainTreeRoot root from 1 subroot', () => {
                    testMergeShortestOne(SUB_DEPTH, HASH_LENGTH, ZERO)
                })

                it('Exhaustive test from 2 to 16 subtrees', () => {
                    const MAX = 16
                    testMergeExhaustive(SUB_DEPTH, HASH_LENGTH, ZERO, MAX)
                })
            })
        })
    })
})
