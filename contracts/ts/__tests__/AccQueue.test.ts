jest.setTimeout(90000)
require('module-alias/register')
import { genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    IncrementalQuinTree,
    AccQueue,
    NOTHING_UP_MY_SLEEVE,
} from 'maci-crypto'

import { JSONRPCDeployer } from '../deploy'
const PoseidonT3 = require('@maci-contracts/compiled/PoseidonT3.json')
const PoseidonT6 = require('@maci-contracts/compiled/PoseidonT6.json')

import { loadAB, linkPoseidonLibraries } from '../'

const accounts = genTestAccounts(1)
let deployer
let aqContract
let PoseidonT3Contract, PoseidonT6Contract

const testEmptySubtree = async (aq: AccQueue, aqContract: any, index: number) => {
    aq.fillLastSubTree()
    const tx = await aqContract.fillLastSubTree()
    await tx.wait()
    const subRoot = await aqContract.getSubRoot(index)
    expect(subRoot.toString()).toEqual(aq.getSubRoot(index).toString())
}

const testIncompleteSubtree = async (aq: AccQueue, aqContract: any) => {
    const leaf = BigInt(1)

    aq.enqueue(leaf)
    await (await aqContract.enqueue(leaf.toString())).wait()

    aq.fillLastSubTree()
    await (await aqContract.fillLastSubTree()).wait()

    const subRoot = await aqContract.getSubRoot(1)
    expect(subRoot.toString()).toEqual(aq.getSubRoot(1).toString())
}

const testFillForAllIncompletes = async (aq: AccQueue, aqContract: any) => {
    for (let i = 0; i < 2; i ++) {
        for (let j = 0; j < i; j ++) {
            const leaf = BigInt(i + 1)
            aq.enqueue(leaf)
            await (await aqContract.enqueue(leaf.toString())).wait()
        }
        aq.fillLastSubTree()
        await (await aqContract.fillLastSubTree()).wait()

        const subRoot = await aqContract.getSubRoot(3 + i)
        expect(subRoot.toString()).toEqual(aq.getSubRoot(3 + i).toString())
    }
}

const testEmptyUponDeployment = async (aqContract: any) => {
    const isFull = await aqContract.isFull()
    expect(isFull).toBeFalsy()

    const isSubTreeFull = await aqContract.isSubTreeFull(0)
    expect(isSubTreeFull).toBeFalsy()
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

    console.log('Deploying Poseidon') 
    PoseidonT3Contract = await deployer.deploy(PoseidonT3.abi, PoseidonT3.bytecode, {})
    PoseidonT6Contract = await deployer.deploy(PoseidonT6.abi, PoseidonT6.bytecode, {})

    // Link Poseidon contracts
    linkPoseidonLibraries(
        ['trees/AccQueue.sol'],
        PoseidonT3Contract.address,
        PoseidonT6Contract.address,
    )

    const [ AccQueueAbi, AccQueueBin ] = loadAB(contractName)

    console.log('Deploying AccQueue')
    aqContract = await deployer.deploy(
        AccQueueAbi,
        AccQueueBin,
        SUB_DEPTH,
        HASH_LENGTH,
    )

    const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO)
    return { aq, aqContract }
}

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

        const tx = await aqContract.enqueue(leaf.toString())
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

        const tx = await aqContract.enqueue(leaf.toString())
        //const receipt = await tx.wait()
        //console.log(i, receipt.gasUsed.toString())
        await tx.wait()
    }

    numLeaves = await aqContract.numLeaves()
    expect(numLeaves.toString()).toEqual((subtreeCapacity * 2).toString())

    const subroot1 = await aqContract.getSubRoot(1)
    expect(subroot1.toString()).toEqual(tree1.root.toString())
}

const testMerge = async (
    aq: AccQueue,
    aqContract: any,
    NUM_SUBTREES: number,
    MAIN_DEPTH: number,
) => {
    for (let i = 0; i < NUM_SUBTREES; i ++) {
        const leaf = BigInt(123)
        await (await aqContract.enqueue(leaf.toString())).wait()
        aq.enqueue(leaf)

        aq.fillLastSubTree()
        await (await aqContract.fillLastSubTree()).wait()
    }
    const minHeight = await aqContract.calcMinHeight()
    expect(minHeight.toString()).toEqual('5')

    aq.mergeSubRootsIntoShortestTree(0)
    await (await aqContract.mergeSubRootsIntoShortestTree(0)).wait()

    const expectedSmallSRTroot = aq.smallSRTroot
    const contractSmallSRTroot = await aqContract.getSmallSRTroot()

    expect(expectedSmallSRTroot.toString()).toEqual(contractSmallSRTroot.toString())

    aq.merge(MAIN_DEPTH)
    await (await aqContract.merge(MAIN_DEPTH)).wait()

    const expectedMainRoot = aq.mainRoots[MAIN_DEPTH]
    const contractMainRoot = await aqContract.getMainRoot(MAIN_DEPTH)

    expect(expectedMainRoot.toString()).toEqual(contractMainRoot.toString())
}

describe('AccQueues', () => {
    describe('Binary AccQueue0 one-shot merges', () => {
        const SUB_DEPTH = 2
        const MAIN_DEPTH = 5
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)
        const NUM_SUBTREES = 5
        let aq: AccQueue
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

        it(`Should merge ${NUM_SUBTREES} subtrees`, async () => {
            await testMerge(aq, aqContract, NUM_SUBTREES, MAIN_DEPTH)
        })

        it(`Should merge ${NUM_SUBTREES + 1} subtrees`, async () => {
            await testMerge(aq, aqContract, NUM_SUBTREES + 1, MAIN_DEPTH)
        })
    })

    describe('Binary AccQueue0 progressive merges', () => {
        const SUB_DEPTH = 2
        const MAIN_DEPTH = 5
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)
        const NUM_SUBTREES = 5
        let aq: AccQueue
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
                await (await aqContract.enqueue(leaf.toString())).wait()
                aq.enqueue(leaf)

                aq.fillLastSubTree()
                await (await aqContract.fillLastSubTree()).wait()
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

    describe('Binary AccQueue0 fills', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)
        let aq: AccQueue

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
            await testFillForAllIncompletes(aq, aqContract)
        })
    })

    describe('Quinary AccQueue0 fills', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 5
        const ZERO = BigInt(0)
        let aq: AccQueue

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
            await testFillForAllIncompletes(aq, aqContract)
        })
    })

    describe('Binary AccQueueMaci fills', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 2
        const ZERO = NOTHING_UP_MY_SLEEVE
        let aq: AccQueue

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
            await testFillForAllIncompletes(aq, aqContract)
        })
    })

    describe('Quinary AccQueueMaci fills', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 5
        const ZERO = NOTHING_UP_MY_SLEEVE
        let aq: AccQueue

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
            await testFillForAllIncompletes(aq, aqContract)
        })
    })

    describe('Binary AccQueue enqueues', () => {
        const SUB_DEPTH = 2
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)

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
            test
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
        const SUB_DEPTH = 1
        const HASH_LENGTH = 5
        const ZERO = BigInt(0)

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
