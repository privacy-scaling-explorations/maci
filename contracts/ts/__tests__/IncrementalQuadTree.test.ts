require('module-alias/register')
jest.setTimeout(60000)
import { genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    genRandomSalt,
    NOTHING_UP_MY_SLEEVE,
    IncrementalQuadTree,
} from 'maci-crypto'

import * as etherlime from 'etherlime-lib'
const PoseidonT3 = require('@maci-contracts/compiled/PoseidonT3.json')
const PoseidonT6 = require('@maci-contracts/compiled/PoseidonT6.json')

const IncrementalQuadTreeAbi = require('@maci-contracts/compiled/IncrementalQuadTree.json')
const ComputeRootAbi = require('@maci-contracts/compiled/ComputeRoot.json')

const accounts = genTestAccounts(1)
let deployer
let mtContract
let crContract
let PoseidonT3Contract, PoseidonT6Contract

const DEPTH = 32

let tree
describe('IncrementalQuadTree', () => {
    beforeAll(async () => {
        deployer = new etherlime.JSONRPCPrivateKeyDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 10000000,
            },
        )

        console.log('Deploying PoseidonT3Contract')
        PoseidonT3Contract = await deployer.deploy(PoseidonT3, {})
        PoseidonT6Contract = await deployer.deploy(PoseidonT6, {})

        console.log('Deploying IncrementalQuadTree')
        mtContract = await deployer.deploy(
            IncrementalQuadTreeAbi,
            {
                PoseidonT3: PoseidonT3Contract.contractAddress,
                PoseidonT6: PoseidonT6Contract.contractAddress
            },
            DEPTH,
            NOTHING_UP_MY_SLEEVE.toString(),
        )

        //console.log('Deploying ComputeRoot')
        //crContract = await deployer.deploy(
            //ComputeRootAbi,
            //{
                //PoseidonT3: PoseidonT3Contract.contractAddress,
                //PoseidonT6: PoseidonT6Contract.contractAddress
            //},
        //)

        tree = new IncrementalQuadTree(DEPTH, NOTHING_UP_MY_SLEEVE)
    })

    //it('an empty tree should have the correct root', async () => {
        //const root1 = await mtContract.root()
        //expect(tree.root.toString()).toEqual(root1.toString())
    //})

    //it('computeEmptyQuadRoot() should generate the correct root', async () => {
        //const emptyRoot = await crContract.computeEmptyQuadRoot(DEPTH, NOTHING_UP_MY_SLEEVE.toString())
        //expect(tree.root.toString()).toEqual(emptyRoot.toString())
    //})

    it('the on-chain root should match an off-chain root after various insertions', async () => {
        expect.assertions(1)
        for (let i = 0; i < 1; i++) {
            const leaf = i

            tree.insert(leaf)
            const tx = await mtContract.insertLeaf(leaf.toString())
            await tx.wait()
            const root1 = (await mtContract.root()).toString()

            expect(tree.root.toString()).toEqual(root1)
        }
    })
})
