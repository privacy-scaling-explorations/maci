jest.setTimeout(9000000)
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
let tx
let receipt

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

const testMerge = async (
    aq: AccQueue,
    aqContract: any,
    NUM_SUBTREES: number,
    MAIN_DEPTH: number,
    NUM_MERGES: number,
) => {
    for (let i = 0; i < NUM_SUBTREES; i ++) {
        const leaf = BigInt(123)
        await (await aqContract.enqueue(leaf.toString(), { gasLimit: 200000 })).wait()
        aq.enqueue(leaf)

        aq.fillLastSubTree()
        await (await aqContract.fillLastSubTree({ gasLimit: 2000000 })).wait()
    }

    if (NUM_MERGES === 0) {
        aq.mergeSubRootsIntoShortestTree(NUM_MERGES)
        tx = await aqContract.mergeSubRootsIntoShortestTree(NUM_MERGES, { gasLimit: 8000000 })
        receipt = await tx.wait()
        console.log(`mergeSubRootsIntoShortestTree() for ${NUM_SUBTREES} subtrees: ${receipt.gasUsed.toString()} gas`)
    } else {
        for (let i = 0; i < NUM_MERGES; i ++) {
            const n = NUM_SUBTREES / NUM_MERGES
            aq.mergeSubRootsIntoShortestTree(n)
            tx = await aqContract.mergeSubRootsIntoShortestTree(n, { gasLimit: 8000000 })
            receipt = await tx.wait()
            console.log(`mergeSubRootsIntoShortestTree() for ${NUM_SUBTREES} subtrees: ${receipt.gasUsed.toString()} gas`)
        }
    }

    const expectedSmallSRTroot = aq.smallSRTroot

    const contractSmallSRTroot = await aqContract.getSmallSRTroot()

    expect(expectedSmallSRTroot.toString()).toEqual(contractSmallSRTroot.toString())

    aq.merge(MAIN_DEPTH)
    tx = await aqContract.merge(MAIN_DEPTH, { gasLimit: 8000000 })
    receipt = await tx.wait()
    console.log(`merge() for ${NUM_SUBTREES} subtrees to depth ${MAIN_DEPTH}: ${receipt.gasUsed.toString()} gas`)

    const expectedMainRoot = aq.mainRoots[MAIN_DEPTH]
    const contractMainRoot = await aqContract.getMainRoot(MAIN_DEPTH)

    expect(expectedMainRoot.toString()).toEqual(contractMainRoot.toString())
}

const testOneShot = async (
    aq: AccQueue,
    aqContract: any,
    NUM_SUBTREES: number,
    MAIN_DEPTH: number,
) => {
    await testMerge(aq, aqContract, NUM_SUBTREES, MAIN_DEPTH, 0)
}

const testMultiShot = async (
    aq: AccQueue,
    aqContract: any,
    NUM_SUBTREES: number,
    MAIN_DEPTH: number,
    NUM_MERGES: number,
) => {
    await testMerge(aq, aqContract, NUM_SUBTREES, MAIN_DEPTH, NUM_MERGES)
}

describe('AccQueue gas benchmarks', () => {
    describe('Binary AccQueue0 one-shot merge', () => {
        const SUB_DEPTH = 4
        const MAIN_DEPTH = 32
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)
        const NUM_SUBTREES = 32
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
            await testOneShot(aq, aqContract, NUM_SUBTREES, MAIN_DEPTH)
        })
    })

    describe('Binary AccQueue0 multi-shot merge', () => {
        const SUB_DEPTH = 4
        const MAIN_DEPTH = 32
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)
        const NUM_SUBTREES = 128
        const NUM_MERGES = 4
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

        it(`Should merge ${NUM_SUBTREES} subtrees in ${NUM_MERGES}`, async () => {
            await testMultiShot(aq, aqContract, NUM_SUBTREES, MAIN_DEPTH, NUM_MERGES)
        })
    })
})
