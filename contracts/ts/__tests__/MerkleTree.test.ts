require('module-alias/register')
import { genAccounts, genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    genRandomSalt,
    hashOne,
    SnarkBigInt,
    NOTHING_UP_MY_SLEEVE,
    setupTree,
} from 'maci-crypto'

import * as etherlime from 'etherlime-lib'
const MiMC = require('@maci-contracts/compiled/MiMC.json')
const IncrementalMerkleTree = require('@maci-contracts/compiled/IncrementalMerkleTree.json')

const accounts = genTestAccounts(1)
let deployer
let mtContract
let mimcContract

const DEPTH = 4

describe('IncrementalMerkleTree', () => {
    beforeAll(async () => {
        deployer = new etherlime.JSONRPCPrivateKeyDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 8800000,
            },
        )

        console.log('Deploying MiMC')
        mimcContract = await deployer.deploy(MiMC, {})

        console.log('Deploying IncrementalMerkleTree')
        mtContract = await deployer.deploy(
            IncrementalMerkleTree,
            { MiMC: mimcContract.contractAddress },
            DEPTH,
            NOTHING_UP_MY_SLEEVE.toString(),
        )
    })

    it('insertBlankAtZerothLeaf should have the same behaviour as inserting a zero value', async () => {
        const tree = setupTree(DEPTH, NOTHING_UP_MY_SLEEVE)
        const root1 = await mtContract.root()
        expect(tree.root.toString()).toEqual(root1.toString())

        await mtContract.insertBlankAtZerothLeaf()
        const root2 = await mtContract.root()
        tree.insert(NOTHING_UP_MY_SLEEVE)

        expect(tree.root.toString()).toEqual(root2.toString())

        expect(root1.toString()).toEqual(root2.toString())

        const leaf = hashOne(Date.now())

        await mtContract.insertLeaf(leaf.toString())
        const root3 = await mtContract.root()
        tree.insert(leaf)

        expect(root1.toString() !== root3.toString()).toBeTruthy()
    })

})
