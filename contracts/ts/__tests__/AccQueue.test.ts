jest.setTimeout(90000)
require('module-alias/register')
import { genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    IncrementalQuinTree,
    AccQueue,
    hashLeftRight,
    NOTHING_UP_MY_SLEEVE,
} from 'maci-crypto'

import { JSONRPCDeployer } from '../deploy'
const PoseidonT3 = require('@maci-contracts/compiled/PoseidonT3.json')
const PoseidonT6 = require('@maci-contracts/compiled/PoseidonT6.json')

import { loadAB, linkPoseidonLibraries } from '../'

const accounts = genTestAccounts(1)
let deployer
let PoseidonT3Contract, PoseidonT6Contract

const enqueueGasLimit = { gasLimit: 500000 }
const fillLastSubTreeGasLimit = { gasLimit: 4000000 }
const insertSubTreeGasLimit = { gasLimit: 300000 }

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


const testEmptySubtree = async (aq: AccQueue, aqContract: any, index: number) => {
    aq.fillLastSubTree()
    const tx = await aqContract.fillLastSubTree(fillLastSubTreeGasLimit)
    await tx.wait()
    const subRoot = await aqContract.getSubRoot(index)
    expect(subRoot.toString()).toEqual(aq.getSubRoot(index).toString())
}

/*
 * Insert one leaf and compute the subroot
 */
const testIncompleteSubtree = async (aq: AccQueue, aqContract: any) => {
    const leaf = BigInt(1)

    aq.enqueue(leaf)
    await (await aqContract.enqueue(leaf.toString(), enqueueGasLimit)).wait()

    aq.fillLastSubTree()
    await (await aqContract.fillLastSubTree(fillLastSubTreeGasLimit)).wait()

    const subRoot = await aqContract.getSubRoot(1)
    expect(subRoot.toString()).toEqual(aq.getSubRoot(1).toString())
}

const testFillForAllIncompletes = async (
    aq: AccQueue,
    aqContract: any,
    HASH_LENGTH: number,
) => {
    for (let i = 0; i < HASH_LENGTH; i ++) {
        for (let j = 0; j < i; j ++) {
            const leaf = BigInt(i + 1)
            aq.enqueue(leaf)
            await (await aqContract.enqueue(leaf.toString(), enqueueGasLimit)).wait()
        }
        aq.fillLastSubTree()
        await (await aqContract.fillLastSubTree(fillLastSubTreeGasLimit)).wait()

        const subRoot = await aqContract.getSubRoot(3 + i)
        expect(subRoot.toString()).toEqual(aq.getSubRoot(3 + i).toString())
    }
}

const testEmptyUponDeployment = async (aqContract: any) => {
    expect.assertions(2)

    const numLeaves = await aqContract.numLeaves()
    expect(numLeaves.toString()).toEqual('0')

    try {
        await aqContract.getSubRoot(0)
    } catch (e) {
        const error = 'AccQueue: _index must refer to a complete subtree'
        expect(e.message.endsWith(error)).toBeTruthy()
    }
}

/*
 * Enqueue leaves and check their subroots
 */
const testEnqueue = async (
    aqContract: any,
    HASH_LENGTH: number,
    SUB_DEPTH: number,
    ZERO: BigInt,
) => {
    const subtreeCapacity = HASH_LENGTH ** SUB_DEPTH
    const tree0 = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH)

    // Insert up to a subtree
    for (let i = 0; i < subtreeCapacity; i ++) {
        const leaf = BigInt(i + 1)
        tree0.insert(leaf)

        const tx = await aqContract.enqueue(leaf.toString(), enqueueGasLimit)
        //const receipt = await tx.wait()
        //console.log(i, receipt.gasUsed.toString())
        await tx.wait()
    }

    let numLeaves = await aqContract.numLeaves()
    expect(numLeaves.toString()).toEqual(subtreeCapacity.toString())

    const r = await aqContract.getSubRoot(0)
    expect(r.toString()).toEqual(tree0.root.toString())

    const tree1 = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH)

    // Insert the other subtree
    for (let i = 0; i < subtreeCapacity; i ++) {
        const leaf = BigInt(i + 2)
        tree1.insert(leaf)

        const tx = await aqContract.enqueue(leaf.toString(), enqueueGasLimit)
        //const receipt = await tx.wait()
        //console.log(i, receipt.gasUsed.toString())
        await tx.wait()
    }

    numLeaves = await aqContract.numLeaves()
    expect(numLeaves.toString()).toEqual((subtreeCapacity * 2).toString())

    const subroot1 = await aqContract.getSubRoot(1)
    expect(subroot1.toString()).toEqual(tree1.root.toString())
}

/*
 * Insert subtrees directly
 */
const testInsertSubTrees = async (
    aq: AccQueue,
    aqContract: any,
    NUM_SUBTREES: number,
    MAIN_DEPTH: number,
) => {

    const leaves: BigInt[] = []
    for (let i = 0; i < NUM_SUBTREES; i ++) {
        const subTree = new IncrementalQuinTree(aq.subDepth, aq.zeros[0], aq.hashLength)
        const leaf = BigInt(i)
        subTree.insert(leaf)
        leaves.push(leaf)

        // insert the subtree root
        aq.insertSubTree(subTree.root)
        await (await aqContract.insertSubTree(subTree.root.toString(), insertSubTreeGasLimit)).wait()
    }

    let correctRoot: string
    if (NUM_SUBTREES === 1) {
        correctRoot = aq.subRoots[0].toString()
    } else {
        const depth = calcDepthFromNumLeaves(aq.hashLength, aq.subRoots.length)
        const tree = new IncrementalQuinTree(depth, aq.zeros[aq.subDepth], aq.hashLength)
        for (const sr of aq.subRoots) {
            tree.insert(sr)
        }
        correctRoot = tree.root.toString()
    }

    // Check whether mergeSubRootsIntoShortestTree() works
    aq.mergeSubRootsIntoShortestTree(0)
    await (await aqContract.mergeSubRootsIntoShortestTree(0, { gasLimit: 8000000 })).wait()

    const expectedSmallSRTroot = aq.smallSRTroot.toString()

    expect(correctRoot).toEqual(expectedSmallSRTroot)

    const contractSmallSRTroot = await aqContract.getSmallSRTroot()
    expect(expectedSmallSRTroot.toString()).toEqual(contractSmallSRTroot.toString())

    // Check whether merge() works
    aq.merge(MAIN_DEPTH)
    await (await aqContract.merge(MAIN_DEPTH, { gasLimit: 8000000 })).wait()

    const expectedMainRoot = aq.mainRoots[MAIN_DEPTH]
    const contractMainRoot = await aqContract.getMainRoot(MAIN_DEPTH)

    expect(expectedMainRoot.toString()).toEqual(contractMainRoot.toString())
}

/*
 * Insert a number of subtrees and merge them all into a main tree
 */
const testMerge = async (
    aq: AccQueue,
    aqContract: any,
    NUM_SUBTREES: number,
    MAIN_DEPTH: number,
) => {
    // The raw leaves of the main tree
    const leaves: BigInt[] = []
    for (let i = 0; i < NUM_SUBTREES; i ++) {
        const leaf = BigInt(i)

        aq.enqueue(leaf)
        aq.fillLastSubTree()
        await (await aqContract.enqueue(leaf.toString(), enqueueGasLimit)).wait()
        await (await aqContract.fillLastSubTree(fillLastSubTreeGasLimit)).wait()

        leaves.push(leaf)

        for (let i = 1; i < aq.hashLength ** aq.subDepth; i ++) {
            leaves.push(aq.zeros[0])
        }
    }

    // Insert leaves into a main tree
    const tree = new IncrementalQuinTree(MAIN_DEPTH, aq.zeros[0], aq.hashLength)
    for (const leaf of leaves) {
        tree.insert(leaf)
    }

    // minHeight should be the small SRT height
    const minHeight = await aqContract.calcMinHeight()
    const c = calcDepthFromNumLeaves(aq.hashLength, NUM_SUBTREES)
    expect(minHeight.toString()).toEqual(c.toString())

    // Check whether mergeSubRootsIntoShortestTree() works
    aq.mergeSubRootsIntoShortestTree(0)
    await (await aqContract.mergeSubRootsIntoShortestTree(0, { gasLimit: 8000000 })).wait()

    const expectedSmallSRTroot = aq.smallSRTroot.toString()
    const contractSmallSRTroot = (await aqContract.getSmallSRTroot()).toString()

    expect(expectedSmallSRTroot).toEqual(contractSmallSRTroot)

    if (NUM_SUBTREES === 1) {
        expect(expectedSmallSRTroot).toEqual(aq.subRoots[0].toString())
    } else {
        // Check whether the small SRT root is correct
        const srtHeight = calcDepthFromNumLeaves(aq.hashLength, NUM_SUBTREES)
        const smallTree = new IncrementalQuinTree(srtHeight, aq.zeros[aq.subDepth], aq.hashLength)
        for (const s of aq.subRoots) {
            smallTree.insert(s)
        }
        expect(expectedSmallSRTroot).toEqual(smallTree.root.toString())
    }

    // Check whether mergeDirect() works
    const aq2 = aq.copy()

    aq2.mergeDirect(MAIN_DEPTH)
    const directlyMergedRoot = aq2.mainRoots[MAIN_DEPTH].toString()
    expect(directlyMergedRoot.toString()).toEqual(tree.root.toString())

    // Check whether off-chain merge() works
    aq.merge(MAIN_DEPTH)

    const expectedMainRoot = aq.mainRoots[MAIN_DEPTH].toString()

    expect(expectedMainRoot).toEqual(directlyMergedRoot)

    // Check whether on-chain merge() works
    await (await aqContract.merge(MAIN_DEPTH, { gasLimit: 8000000 })).wait()
    const contractMainRoot = (await aqContract.getMainRoot(MAIN_DEPTH)).toString()
    expect(expectedMainRoot).toEqual(contractMainRoot)
}

const deploy = async (
    contractName: string,
    SUB_DEPTH: number,
    HASH_LENGTH: number,
    ZERO: BigInt,
) => {
    deployer = new JSONRPCDeployer(
        accounts[0].privateKey,
        config.get('chain.url'),
        {
            gasLimit: 8800000,
        },
    )

    PoseidonT3Contract = await deployer.deploy(PoseidonT3.abi, PoseidonT3.bytecode, {})
    PoseidonT6Contract = await deployer.deploy(PoseidonT6.abi, PoseidonT6.bytecode, {})

    // Link Poseidon contracts
    linkPoseidonLibraries(
        ['trees/AccQueue.sol'],
        PoseidonT3Contract.address,
        PoseidonT6Contract.address,
    )

    const [ AccQueueAbi, AccQueueBin ] = loadAB(contractName)

    const aqContract = await deployer.deploy(
        AccQueueAbi,
        AccQueueBin,
        SUB_DEPTH,
        HASH_LENGTH,
    )

    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
    return { aq, aqContract }
}

describe('AccQueues', () => {

    describe('Conditions that cause merge() to revert', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)
        const NUM_SUBTREES = 1
        let aqContract

        beforeAll(async () => {
            const r = await deploy(
                'AccQueueBinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            aqContract = r.aqContract
        })

        it('mergeSubRootsIntoShortestTree() should fail on an empty AccQueue', async () => {
            expect.assertions(1)
            try {
                await (await (aqContract.mergeSubRootsIntoShortestTree(0, { gasLimit: 1000000 }))).wait()
            } catch (e) {
                const error = 'AccQueue: nothing to merge'
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })

        it('merge() should fail on an empty AccQueue', async () => {
            expect.assertions(1)
            try {
                await (await (aqContract.merge(1, { gasLimit: 1000000 }))).wait()
            } catch (e) {
                const error = 'AccQueue: subtrees must be merged before calling merge()'
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })

        it(`Should not merge if the subtrees have not been merged yet`, async () => {
            expect.assertions(1)

            for (let i = 0; i < NUM_SUBTREES; i ++) {
                await (await (aqContract.fillLastSubTree(fillLastSubTreeGasLimit))).wait()
            }

            try {
                await (await (aqContract.merge(1))).wait()
            } catch (e) {
                const error = 'AccQueue: subtrees must be merged before calling merge()'
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })

        it(`Should not merge if the desired depth is invalid`, async () => {
            expect.assertions(1)

            await (await (aqContract.mergeSubRootsIntoShortestTree(0, { gasLimit: 1000000 }))).wait()
            try {
                await (await (aqContract.merge(1))).wait()
            } catch (e) {
                const error = 'AccQueue: _depth must be gte the SRT depth'
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })
    })

    describe('Edge cases', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)

        it('Should not be possible to merge if empty', async () => {
            expect.assertions(1)
            const r = await deploy(
                'AccQueueBinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            const aqContract = r.aqContract
            try {
                await (await aqContract.mergeSubRootsIntoShortestTree(0, { gasLimit: 1000000 })).wait()
            } catch (e) {
                const error = 'AccQueue: nothing to merge'
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })

        it('Should not be possible to merge into a tree of depth 0', async () => {
            const r = await deploy(
                'AccQueueBinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )

            const aqContract = r.aqContract
            await (await aqContract.enqueue(1)).wait()
            await (await aqContract.mergeSubRootsIntoShortestTree(0, { gasLimit: 1000000 })).wait()
            try {
                await (await aqContract.merge(0, { gasLimit: 1000000 })).wait()
            } catch (e) {
                const error = 'AccQueue: _depth must be more than 0'
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })

        it('A small SRT of depth 1 should just have 2 leaves', async () => {
            const r = await deploy(
                'AccQueueBinary0',
                1,
                HASH_LENGTH,
                ZERO,
            )

            const aqContract = r.aqContract
            await (await aqContract.enqueue(0, enqueueGasLimit)).wait()
            await (await aqContract.mergeSubRootsIntoShortestTree(0, { gasLimit: 1000000 })).wait()
            const srtRoot = await aqContract.getSmallSRTroot()
            const expectedRoot = hashLeftRight(BigInt(0), BigInt(0))
            expect(srtRoot.toString()).toEqual(expectedRoot.toString())
        })

        it('Should not be possible to merge subroots into a tree shorter than the SRT depth', async () => {
            const r = await deploy(
                'AccQueueBinary0',
                1,
                HASH_LENGTH,
                ZERO,
            )
            const aqContract = r.aqContract
            for (let i = 0; i < 4; i ++) {
                await (await (aqContract.fillLastSubTree(fillLastSubTreeGasLimit))).wait()
            }

            await (await aqContract.mergeSubRootsIntoShortestTree(0, { gasLimit: 1000000 })).wait()

            try {
                await (await aqContract.merge(1, { gasLimit: 1000000 })).wait()
            } catch (e) {
                const error = 'AccQueue: _depth must be gte the SRT depth'
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })
    })

    describe('Binary AccQueue0 one-shot merges', () => {
        const SUB_DEPTH = 2
        const MAIN_DEPTH = 5
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)

        test.each`
            n
            ${1}
            ${2}
            ${3}
            ${4}
        `('Should merge $n subtrees', async ({ n }) => {
            const r = await deploy(
                'AccQueueBinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            const aq = r.aq
            const aqContract = r.aqContract
            await testMerge(aq, aqContract, n, MAIN_DEPTH)
        })
    })

    describe('Quinary AccQueue0 one-shot merges', () => {
        const SUB_DEPTH = 2
        const MAIN_DEPTH = 6
        const HASH_LENGTH = 5
        const ZERO = BigInt(0)

        test.each`
            n
            ${1}
            ${5}
            ${26}
        `('Should merge $n subtrees', async ({ n }) => {
            const r = await deploy(
                'AccQueueQuinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            const aq = r.aq
            const aqContract = r.aqContract
            await testMerge(aq, aqContract, n, MAIN_DEPTH)
        })
    })

    describe('Binary AccQueue0 subtree insertions', () => {
        const SUB_DEPTH = 2
        const MAIN_DEPTH = 6
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)

        test.each`
            n
            ${1}
            ${2}
            ${3}
            ${9}
        `('Should insert $n subtrees', async ({ n }) => {
            const r = await deploy(
                'AccQueueBinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            const aq = r.aq
            const aqContract = r.aqContract
            await testInsertSubTrees(aq, aqContract, n, MAIN_DEPTH)
        })
    })

    describe('Quinary AccQueue0 subtree insertions', () => {
        const SUB_DEPTH = 2
        const MAIN_DEPTH = 6
        const HASH_LENGTH = 5
        const ZERO = BigInt(0)

        test.each`
            n
            ${1}
            ${4}
            ${9}
            ${26}
        `('Should insert $n subtrees', async ({ n }) => {
            const r = await deploy(
                'AccQueueQuinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            const aq = r.aq
            const aqContract = r.aqContract
            await testInsertSubTrees(aq, aqContract, n, MAIN_DEPTH)
        })
    })

    describe('Binary AccQueue0 progressive merges', () => {
        const SUB_DEPTH = 2
        const MAIN_DEPTH = 5
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)
        const NUM_SUBTREES = 5
        let aq: AccQueue
        let aqContract

        beforeAll(async () => {
            const r = await deploy(
                'AccQueueBinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            aq = r.aq
            aqContract = r.aqContract
        })

        it(`Should progressively merge ${NUM_SUBTREES} subtrees`, async () => {
            expect.assertions(3)
            for (let i = 0; i < NUM_SUBTREES; i ++) {
                const leaf = BigInt(123)
                await (await aqContract.enqueue(leaf.toString(), enqueueGasLimit)).wait()
                aq.enqueue(leaf)

                aq.fillLastSubTree()
                await (await aqContract.fillLastSubTree(fillLastSubTreeGasLimit)).wait()
            }

            aq.mergeSubRootsIntoShortestTree(0)
            const expectedSmallSRTroot = aq.smallSRTroot
            
            try {
                await aqContract.getSmallSRTroot()
            } catch (e) {
                const error = 'AccQueue: subtrees must be merged first'
                expect(e.message.endsWith(error)).toBeTruthy()
            }

            await (await aqContract.mergeSubRootsIntoShortestTree(2)).wait()
            await (await aqContract.mergeSubRootsIntoShortestTree(2)).wait()
            await (await aqContract.mergeSubRootsIntoShortestTree(1)).wait()

            const contractSmallSRTroot = await aqContract.getSmallSRTroot()
            expect(expectedSmallSRTroot.toString()).toEqual(contractSmallSRTroot.toString())

            aq.merge(MAIN_DEPTH)
            await (await aqContract.merge(MAIN_DEPTH)).wait()

            const expectedMainRoot = aq.mainRoots[MAIN_DEPTH]
            const contractMainRoot = await aqContract.getMainRoot(MAIN_DEPTH)

            expect(expectedMainRoot.toString()).toEqual(contractMainRoot.toString())
        })
    })

    describe('Quinary AccQueue0 progressive merges', () => {
        const SUB_DEPTH = 2
        const MAIN_DEPTH = 5
        const HASH_LENGTH = 5
        const ZERO = BigInt(0)
        const NUM_SUBTREES = 6
        let aq: AccQueue
        let aqContract
        beforeAll(async () => {
            const r = await deploy(
                'AccQueueQuinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            aq = r.aq
            aqContract = r.aqContract
        })

        it(`Should progressively merge ${NUM_SUBTREES} subtrees`, async () => {
            expect.assertions(3)
            for (let i = 0; i < NUM_SUBTREES; i ++) {
                const leaf = BigInt(123)
                await (await aqContract.enqueue(leaf.toString(), enqueueGasLimit)).wait()
                aq.enqueue(leaf)

                aq.fillLastSubTree()
                await (await aqContract.fillLastSubTree(fillLastSubTreeGasLimit)).wait()
            }

            aq.mergeSubRootsIntoShortestTree(0)
            const expectedSmallSRTroot = aq.smallSRTroot
            
            try {
                await aqContract.getSmallSRTroot()
            } catch (e) {
                const error = 'AccQueue: subtrees must be merged first'
                expect(e.message.endsWith(error)).toBeTruthy()
            }

            await (await aqContract.mergeSubRootsIntoShortestTree(2)).wait()
            await (await aqContract.mergeSubRootsIntoShortestTree(2)).wait()
            await (await aqContract.mergeSubRootsIntoShortestTree(2)).wait()

            const contractSmallSRTroot = await aqContract.getSmallSRTroot()
            expect(expectedSmallSRTroot.toString()).toEqual(contractSmallSRTroot.toString())

            aq.merge(MAIN_DEPTH)
            await (await aqContract.merge(MAIN_DEPTH)).wait()

            const expectedMainRoot = aq.mainRoots[MAIN_DEPTH]
            const contractMainRoot = await aqContract.getMainRoot(MAIN_DEPTH)

            expect(expectedMainRoot.toString()).toEqual(contractMainRoot.toString())
        })
    })

    describe('Binary AccQueue0 fills', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)
        let aq: AccQueue
        let aqContract

        beforeAll(async () => {
            const r = await deploy(
                'AccQueueBinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            aq = r.aq
            aqContract = r.aqContract
        })

        it('Should fill an empty subtree', async () => {
            await testEmptySubtree(aq, aqContract, 0)
        })

        it('Should fill an incomplete subtree', async () => {
            await testIncompleteSubtree(aq, aqContract)
        })

        it('Filling an empty subtree again should create the correct subroot', async () => {
            await testEmptySubtree(aq, aqContract, 2)
        })

        it('fillLastSubTree() should be correct for every number of leaves in an incomplete subtree', async () => {
            await testFillForAllIncompletes(aq, aqContract, HASH_LENGTH)
        })
    })

    describe('Quinary AccQueue0 fills', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 5
        const ZERO = BigInt(0)
        let aq: AccQueue
        let aqContract

        beforeAll(async () => {
            const r = await deploy(
                'AccQueueQuinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            aq = r.aq
            aqContract = r.aqContract
        })

        it('Should fill an empty subtree', async () => {
            await testEmptySubtree(aq, aqContract, 0)
        })

        it('Should fill an incomplete subtree', async () => {
            await testIncompleteSubtree(aq, aqContract)
        })

        it('Filling an empty subtree again should create the correct subroot', async () => {
            await testEmptySubtree(aq, aqContract, 2)
        })

        it('fillLastSubTree() should be correct for every number of leaves in an incomplete subtree', async () => {
            await testFillForAllIncompletes(aq, aqContract, HASH_LENGTH)
        })
    })

    describe('Binary AccQueueMaci fills', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 2
        const ZERO = NOTHING_UP_MY_SLEEVE
        let aq: AccQueue
        let aqContract

        beforeAll(async () => {
            const r = await deploy(
                'AccQueueBinaryMaci',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            aq = r.aq
            aqContract = r.aqContract
        })

        it('Should fill an empty subtree', async () => {
            await testEmptySubtree(aq, aqContract, 0)
        })

        it('Should fill an incomplete subtree', async () => {
            await testIncompleteSubtree(aq, aqContract)
        })

        it('Filling an empty subtree again should create the correct subroot', async () => {
            await testEmptySubtree(aq, aqContract, 2)
        })

        it('fillLastSubTree() should be correct for every number of leaves in an incomplete subtree', async () => {
            await testFillForAllIncompletes(aq, aqContract, HASH_LENGTH)
        })
    })

    describe('Quinary AccQueueMaci fills', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 5
        const ZERO = NOTHING_UP_MY_SLEEVE
        let aq: AccQueue
        let aqContract

        beforeAll(async () => {
            const r = await deploy(
                'AccQueueQuinaryMaci',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            aq = r.aq
            aqContract = r.aqContract
        })

        it('Should fill an empty subtree', async () => {
            await testEmptySubtree(aq, aqContract, 0)
        })

        it('Should fill an incomplete subtree', async () => {
            await testIncompleteSubtree(aq, aqContract)
        })

        it('Filling an empty subtree again should create the correct subroot', async () => {
            await testEmptySubtree(aq, aqContract, 2)
        })

        it('fillLastSubTree() should be correct for every number of leaves in an incomplete subtree', async () => {
            await testFillForAllIncompletes(aq, aqContract, HASH_LENGTH)
        })
    })

    describe('Binary AccQueue enqueues', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)
        let aqContract

        beforeAll(async () => {
            const r = await deploy(
                'AccQueueBinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            aqContract = r.aqContract
        })

        it('Should be empty upon deployment', async () => {
            await testEmptyUponDeployment(aqContract)
        })

        it('Should not be able to get a subroot that does not exist', async () => {
            expect.assertions(1)
            try {
                await aqContract.getSubRoot(0)
            } catch (e) {
                const error = "AccQueue: _index must refer to a complete subtree"
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })

        it('Should enqueue leaves', async () => {
            await testEnqueue(
                aqContract,
                HASH_LENGTH,
                SUB_DEPTH,
                ZERO,
            )
        })
    })

    describe('Quinary AccQueue enqueues', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 5
        const ZERO = BigInt(0)
        let aqContract

        beforeAll(async () => {
            const r = await deploy(
                'AccQueueQuinary0',
                SUB_DEPTH,
                HASH_LENGTH,
                ZERO,
            )
            aqContract = r.aqContract
        })

        it('Should be empty upon deployment', async () => {
            await testEmptyUponDeployment(aqContract)
        })

        it('Should not be able to get a subroot that does not exist', async () => {
            expect.assertions(1)
            try {
                await aqContract.getSubRoot(0)
            } catch (e) {
                const error = "AccQueue: _index must refer to a complete subtree"
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })

        it('Should enqueue leaves', async () => {
            await testEnqueue(
                aqContract,
                HASH_LENGTH,
                SUB_DEPTH,
                ZERO,
            )
        })
    })
})
