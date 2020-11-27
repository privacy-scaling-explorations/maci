jest.setTimeout(90000)
import * as ethers from 'ethers'
import { timeTravel } from './utils'
import { deployMaci, genDeployer, loadAbi } from '../deploy'
import { deployTestContracts } from '../utils'
import {
    StateLeaf,
    Message,
    Keypair,
} from 'maci-domainobjs'

import { config } from 'maci-config'
import {
    genRandomSalt,
} from 'maci-crypto'

import { genTestAccounts } from '../accounts'
const accounts = genTestAccounts(1)
const deployer = genDeployer(accounts[0].privateKey)

import { JSONRPCDeployer } from '../deploy'
const PoseidonT3 = require('@maci-contracts/compiled/PoseidonT3.json')
const PoseidonT4 = require('@maci-contracts/compiled/PoseidonT4.json')
const PoseidonT5 = require('@maci-contracts/compiled/PoseidonT5.json')
const PoseidonT6 = require('@maci-contracts/compiled/PoseidonT6.json')

import { loadAB, linkPoseidonLibraries } from '../'

let doContract
let hasherContract
let PoseidonT3Contract
let PoseidonT4Contract
let PoseidonT5Contract
let PoseidonT6Contract

describe('DomainObjs', () => {

    describe('Deployment', () => {
        beforeAll(async () => {
            console.log('Deploying Poseidon')

            PoseidonT3Contract = await deployer.deploy(PoseidonT3.abi, PoseidonT3.bytecode, {})
            PoseidonT4Contract = await deployer.deploy(PoseidonT4.abi, PoseidonT4.bytecode, {})
            PoseidonT5Contract = await deployer.deploy(PoseidonT5.abi, PoseidonT5.bytecode, {})
            PoseidonT6Contract = await deployer.deploy(PoseidonT6.abi, PoseidonT6.bytecode, {})

            // Link Poseidon contracts
            linkPoseidonLibraries(
                ['DomainObjs.sol'],
                PoseidonT3Contract.address,
                PoseidonT4Contract.address,
                PoseidonT5Contract.address,
                PoseidonT6Contract.address,
            )

            const [ DoAbi, DoBin ] = loadAB('DomainObjs')

            console.log('Deploying DomainObjs')
            doContract = await deployer.deploy(
                DoAbi,
                DoBin,
            )
        })

        it('should correctly hash a StateLeaf', async () => {
            const keypair = new Keypair()
            const voiceCreditBalance = BigInt(1234)
            const stateLeaf = new StateLeaf(
                keypair.pubKey,
                voiceCreditBalance,
            )
            const onChainHash = await doContract.hashStateLeaf(
                stateLeaf.asContractParam(),
            )
            const expectedHash = stateLeaf.hash()

            expect(onChainHash.toString()).toEqual(expectedHash.toString())
        })

        it('should correctly hash a Messsage', async () => {
            const data: BigInt[] = []
            for (let i = 0; i < Message.DATA_LENGTH; i ++) {
                data.push(genRandomSalt())
            }
            debugger
            const message = new Message(
                genRandomSalt(),
                data,
            )

            const onChainHash = await doContract.hashMessage(
                message.asContractParam(),
            )
            const expectedHash = message.hash()

            expect(onChainHash.toString()).toEqual(expectedHash.toString())
        })
    })
})
