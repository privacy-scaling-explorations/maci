require('module-alias/register')
jest.setTimeout(60000)

import * as ethers from 'ethers'
import { config } from 'maci-config'
import { MaciState } from 'maci-core'
import {
    genRandomSalt,
    NOTHING_UP_MY_SLEEVE,
} from 'maci-crypto'

import {
    PrivKey,
    Command,
    Keypair,
} from 'maci-domainobjs'

import { timeTravel } from './utils'
import {
    genDeployer,
    genTestAccounts,
    deployMaci,
    deployFreeForAllSignUpGatekeeper,
    deployConstantInitialVoiceCreditProxy,
} from '../'


const accounts = genTestAccounts(5)
const deployer = genDeployer(accounts[0].privateKey)
let freeForAllSignUpGatekeeperContract
let constantIntialVoiceCreditProxyContract
let maciContract
const coordinator = new Keypair(new PrivKey(BigInt(config.maci.coordinatorPrivKey)))
const stateTreeDepth = config.maci.merkleTrees.stateTreeDepth
const messageTreeDepth = config.maci.merkleTrees.messageTreeDepth
const voteOptionTreeDepth = config.maci.merkleTrees.voteOptionTreeDepth
const initialVoiceCreditBalance = config.maci.initialVoiceCreditBalance

const maciState = new MaciState(
    coordinator,
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    NOTHING_UP_MY_SLEEVE,
)

describe('Publishing messages', () => {
    beforeAll(async () => {
        freeForAllSignUpGatekeeperContract = await deployFreeForAllSignUpGatekeeper(deployer)
        constantIntialVoiceCreditProxyContract = await deployConstantInitialVoiceCreditProxy(
            deployer,
            initialVoiceCreditBalance,
        )

        const contracts = await deployMaci(
            deployer,
            freeForAllSignUpGatekeeperContract.address,
            constantIntialVoiceCreditProxyContract.address,
        )

        maciContract = contracts.maciContract
        const keypair = new Keypair()
        maciState.signUp(keypair.pubKey, initialVoiceCreditBalance)
        const tx = await maciContract.signUp(
            keypair.pubKey.asContractParam(),
            ethers.utils.defaultAbiCoder.encode(['uint256'], [0]),
            ethers.utils.defaultAbiCoder.encode(['uint256'], [0]),
        )
        const receipt = await tx.wait()
        console.log('Signup gas:', receipt.gasUsed.toString())
    })

    it('The empty message tree should have the correct root', async () => {
        const root = maciState.genMessageRoot()
        const root2 = await maciContract.getMessageTreeRoot()  

        expect(root.toString()).toEqual(root2.toString())
    })

    it('anyone may publish a message before the sign-up period passes', async () => {
        expect.assertions(1)
        const keypair = new Keypair()
        const command = new Command(
            BigInt(0),
            keypair.pubKey,
            BigInt(0),
            BigInt(0),
            BigInt(0),
            genRandomSalt(),
        )
        const signature = command.sign(keypair.privKey)
        const message = command.encrypt(signature, BigInt(0))

        maciState.publishMessage(
            message,
            keypair.pubKey,
        )

        const tx = await maciContract.publishMessage(
            message.asContractParam(),
            keypair.pubKey.asContractParam(),
        )
        const receipt = await tx.wait()
        expect(receipt.status).toEqual(1)
    })

    it('A message tree with several messages should have the correct root', async () => {
        // Move forward in time
        await timeTravel(deployer.provider, config.maci.signUpDurationInSeconds + 1)

        for (let i = 0; i < 4; i++) {
            const keypair = new Keypair()
            const command = new Command(
                BigInt(0),
                keypair.pubKey,
                BigInt(0),
                BigInt(0),
                BigInt(0),
                genRandomSalt(),
            )
            const signature = command.sign(keypair.privKey)
            const message = command.encrypt(signature, BigInt(0))
            const tx = await maciContract.publishMessage(
                message.asContractParam(),
                keypair.pubKey.asContractParam(),
            )
            const receipt = await tx.wait()
            expect(receipt.status).toEqual(1)
            console.log('publishMessage gas:', receipt.gasUsed.toString())
            const maciInterface = new ethers.utils.Interface(maciContract.interface.abi)
            const event = maciInterface.parseLog(receipt.logs[1])
            expect(event.values._message.data).toEqual(message.asContractParam()[1])
            expect(event.values._encPubKey.x).toEqual(keypair.pubKey.asContractParam()[0])

            maciState.publishMessage(
                message,
                keypair.pubKey,
            )
            const root = maciState.genMessageRoot()
            const root2 = await maciContract.getMessageTreeRoot()  

            expect(root.toString()).toEqual(root2.toString())
        }
    })
})

