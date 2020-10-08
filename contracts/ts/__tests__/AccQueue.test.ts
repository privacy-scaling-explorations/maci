jest.setTimeout(90000)
require('module-alias/register')
import { genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import { IncrementalQuinTree } from 'maci-crypto'
import {
    genRandomSalt,
} from 'maci-crypto'

import { JSONRPCDeployer } from '../deploy'
const PoseidonT3 = require('@maci-contracts/compiled/PoseidonT3.json')
const PoseidonT6 = require('@maci-contracts/compiled/PoseidonT6.json')

import { loadAB, linkPoseidonLibraries } from '../'

const accounts = genTestAccounts(1)
let deployer
let aqContract
let PoseidonT3Contract, PoseidonT6Contract

describe('AccQueues', () => {
    describe('Binary AccQueue', () => {
        const DEPTH = 2
        const HASH_LENGTH = 2

        beforeAll(async () => {
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

            const [ AccQueueAbi, AccQueueBin ] = loadAB('AccQueue')

            console.log('Deploying AccQueue')
            aqContract = await deployer.deploy(
                AccQueueAbi,
                AccQueueBin,
                DEPTH,
                HASH_LENGTH,
            )
        })

        it('Should insert a leaf', async () => {
            const capacity = HASH_LENGTH ** DEPTH
            const tree = new IncrementalQuinTree(DEPTH, BigInt(0), HASH_LENGTH)

            for (let i = 0; i < capacity; i ++) {
                // The queue should not be full
                const isFull = await aqContract.isFull()
                expect(isFull).toBeFalsy()

                const leaf = genRandomSalt()
                tree.insert(BigInt(leaf))

                const tx = await aqContract.queue(
                    leaf.toString(),
                )
                //const receipt = await tx.wait()
                await tx.wait()
                //console.log(i, receipt.gasUsed.toString())

            }

            const isFull2 = await aqContract.isFull()
            expect(isFull2).toBeTruthy()

            const r = await aqContract.getRoot()

            //const f = await aqContract.getLevelValue(DEPTH, 0)
            //expect(f.toString()).toEqual(r.toString())

            expect(r.toString()).toEqual(tree.root.toString())
        })
    })

    describe('Quinary AccQueue', () => {
        const DEPTH = 2
        const HASH_LENGTH = 5

        beforeAll(async () => {
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

            const [ AccQueueAbi, AccQueueBin ] = loadAB('AccQueue')

            console.log('Deploying AccQueue')
            aqContract = await deployer.deploy(
                AccQueueAbi,
                AccQueueBin,
                DEPTH,
                HASH_LENGTH,
            )
        })

        it('Should insert a leaf', async () => {
            const capacity = HASH_LENGTH ** DEPTH
            const tree = new IncrementalQuinTree(DEPTH, BigInt(0), HASH_LENGTH)

            for (let i = 0; i < capacity; i ++) {
                // The queue should not be full
                const isFull = await aqContract.isFull()
                expect(isFull).toBeFalsy()

                const leaf = genRandomSalt()
                tree.insert(BigInt(leaf))

                const tx = await aqContract.queue(
                    leaf.toString(),
                )
                await tx.wait()
                //const receipt = await tx.wait()
                //console.log(i, receipt.gasUsed.toString())
            }

            const isFull2 = await aqContract.isFull()
            expect(isFull2).toBeTruthy()

            const r = await aqContract.getRoot()

            //const f = await aqContract.getLevelValue(DEPTH, 0)
            //expect(f.toString()).toEqual(r.toString())

            expect(r.toString()).toEqual(tree.root.toString())
        })
    })
})
