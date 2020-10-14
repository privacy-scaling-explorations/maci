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

const testOneShot = async (
    aq: AccQueue,
    aqContract: any,
    NUM_SUBTREES: number,
    MAIN_DEPTH: number,
) => {
    for (let i = 0; i < NUM_SUBTREES; i ++) {
        const leaf = BigInt(123)
        await (await aqContract.enqueue(leaf.toString(), { gasLimit: 200000 })).wait()
        aq.enqueue(leaf)

        aq.fillLastSubTree()
        await (await aqContract.fillLastSubTree({ gasLimit: 2000000 })).wait()
    }

    aq.mergeSubRootsIntoShortestTree(0)
    const expectedSmallSRTroot = aq.smallSRTroot

    tx = await aqContract.mergeSubRootsIntoShortestTree(0, { gasLimit: 8000000 })
    receipt = await tx.wait()
    console.log(`mergeSubRootsIntoShortestTree() for ${NUM_SUBTREES} subtrees: ${receipt.gasUsed.toString()} gas`)

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

describe('AccQueue gas benchmarks', () => {
    describe('Binary AccQueue0 one-shot merges', () => {
        const SUB_DEPTH = 2
        const MAIN_DEPTH = 15
        const HASH_LENGTH = 2
        const ZERO = BigInt(0)
        const NUM_SUBTREES = 8
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
})
