require('module-alias/register')
jest.setTimeout(60000)

import * as ethers from 'ethers'
import { config } from 'maci-config'
import { MaciState } from 'maci-core'
import {
    bigInt,
    genRandomSalt,
    NOTHING_UP_MY_SLEEVE,
} from 'maci-crypto'

import {
    PrivKey,
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

import {
    genDeployer,
    genTestAccounts,
    deployMaci,
    deployFreeForAllSignUpGatekeeper,
    deployConstantInitialVoiceCreditProxy,
} from 'maci-contracts'

const initialVoiceCreditBalance = config.maci.initialVoiceCreditBalance

const accounts = genTestAccounts(5)
const deployer = genDeployer(accounts[0].privateKey)
let freeForAllSignUpGatekeeperContract
let constantIntialVoiceCreditProxyContract
let maciContract
const coordinator = new Keypair(new PrivKey(bigInt(config.maci.coordinatorPrivKey)))
const stateTreeDepth = config.maci.merkleTrees.stateTreeDepth
const messageTreeDepth = config.maci.merkleTrees.messageTreeDepth
const voteOptionTreeDepth = config.maci.merkleTrees.voteOptionTreeDepth

const maciState = new MaciState(
    coordinator,
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    NOTHING_UP_MY_SLEEVE,
)

describe('Sign-ups', () => {
    beforeAll(async () => {
        freeForAllSignUpGatekeeperContract = await deployFreeForAllSignUpGatekeeper(deployer)
        constantIntialVoiceCreditProxyContract = await deployConstantInitialVoiceCreditProxy(
            deployer,
            initialVoiceCreditBalance,
        )

        const contracts = await deployMaci(
            deployer,
            freeForAllSignUpGatekeeperContract.contractAddress,
            constantIntialVoiceCreditProxyContract.contractAddress,
        )

        maciContract = contracts.maciContract
    })

    it('An empty MaciState should have the correct state root', async () => {
        const contractStateRoot = await maciContract.getStateTreeRoot()
        expect(contractStateRoot.toString()).toEqual(maciState.genStateRoot().toString())
    })

    it('Signing up to the contract and MaciState should result in the matching state tree roots', async () => {
        expect.assertions(8)
        for (let i = 0; i < 4; i++) {
            const keypair = new Keypair()
            await maciContract.signUp(
                keypair.pubKey.asContractParam(),
                ethers.utils.defaultAbiCoder.encode(['uint256'], [0]),
                ethers.utils.defaultAbiCoder.encode(['uint256'], [0]),
            )
            const contractStateRoot = await maciContract.getStateTreeRoot()
            expect(contractStateRoot.toString()).not.toEqual(maciState.genStateRoot().toString())

            maciState.signUp(keypair.pubKey, initialVoiceCreditBalance)
            expect(contractStateRoot.toString()).toEqual(maciState.genStateRoot().toString())
        }
    })
})
