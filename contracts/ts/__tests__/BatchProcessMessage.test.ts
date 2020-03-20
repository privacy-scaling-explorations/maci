require('module-alias/register')

jest.setTimeout(1200000)

import * as fs from 'fs'
import * as path from 'path'
import * as ethers from 'ethers'
import * as etherlime from 'etherlime-lib'

import { genTestAccounts } from '../accounts'
import { timeTravel } from '../'
import { deployTestContracts } from '../utils'

import { config } from 'maci-config'

import { formatProofForVerifierContract } from '../utils'

import {
    deployMaci,
    deploySignupToken,
    deploySignupTokenGatekeeper,
    deployConstantInitialVoiceCreditProxy,
    genDeployer,
} from '../deploy'

import {
    bigInt,
    hash,
    hashOne,
    genKeyPair,
    genPubKey,
    genRandomSalt,
    IncrementalMerkleTree,
    SnarkBigInt,
    genEcdhSharedKey,
    NOTHING_UP_MY_SLEEVE,
    unstringifyBigInts,
    stringifyBigInts,
} from 'maci-crypto'

import {
    StateLeaf,
    Message,
    Command,
    Keypair,
    PubKey,
    PrivKey,
} from 'maci-domainobjs'

import {
    MaciState,
} from 'maci-core'

import {
    compileAndLoadCircuit,
    genBatchUstInputs,
} from 'maci-circuits'

import {
    SnarkProvingKey,
    SnarkVerifyingKey,
    genProof,
    verifyProof,
    parseVerifyingKeyJson,
    genPublicSignals,
} from 'libsemaphore'

const loadPk = (binName: string): SnarkProvingKey => {
    const p = path.join(__dirname, '../../../circuits/build/' + binName + '.bin')
    return fs.readFileSync(p)
}

const loadkVk = (jsonName: string): SnarkVerifyingKey => {
    const p = path.join(__dirname, '../../../circuits/build/' + jsonName + '.json')
    return parseVerifyingKeyJson(fs.readFileSync(p).toString())
}

const batchUstPk: SnarkProvingKey = loadPk('batchUstPk')
const batchUstVk: SnarkVerifyingKey = loadkVk('batchUstVk')

const accounts = genTestAccounts(5)
const deployer = genDeployer(accounts[0].privateKey)

const batchSize = config.maci.messageBatchSize
const stateTreeDepth = config.maci.merkleTrees.stateTreeDepth
const messageTreeDepth = config.maci.merkleTrees.messageTreeDepth
const voteOptionTreeDepth = config.maci.merkleTrees.voteOptionTreeDepth
const voteOptionsMaxIndex = config.maci.voteOptionsMaxLeafIndex
const numVoteOptions = 2 ** voteOptionTreeDepth
const intermediateStateTreeDepth = config.maci.merkleTrees.intermediateStateTreeDepth

const coordinator = new Keypair(new PrivKey(bigInt(config.maci.coordinatorPrivKey)))
const maciState = new MaciState(
    coordinator,
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    voteOptionsMaxIndex,
)

const users: any[] = []

let maciContract
let stateRootBefore

describe('BatchProcessMessage', () => {
    beforeAll(async () => {
        // Deploy contracts

        const contracts = await deployTestContracts(
            deployer,
            config.maci.initialVoiceCreditBalance,
        )
        maciContract = contracts.maciContract

        // Create users
        for (let i = 1; i < accounts.length; i++) {
            const keypair = new Keypair()
            const command = new Command(
                bigInt(1),
                keypair.pubKey,
                bigInt(0),
                bigInt(i),
                bigInt(i + 1),
                genRandomSalt(),
            )

            const ephemeralKeypair = new Keypair()
            const signature = command.sign(keypair.privKey)
            const sharedKey = Keypair.genEcdhSharedKey(ephemeralKeypair.privKey, coordinator.pubKey)
            const message = command.encrypt(signature, sharedKey)

            users.push({
                wallet: accounts[i],
                keypair,
                ephemeralKeypair,
                command,
                message,
            })
        }
    })

    describe('Sign-ups', () => {
        it('The state root should be correct after signing up four users', async () => {
            // Sign the users up
            for (let user of users) {
                maciState.signUp(
                    user.keypair.pubKey, 
                    bigInt(
                        config.maci.initialVoiceCreditBalance,
                    ),
                )

                const tx = await maciContract.signUp(
                    user.keypair.pubKey.asContractParam(),
                    ethers.utils.defaultAbiCoder.encode(['uint256'], [1]),
                    ethers.utils.defaultAbiCoder.encode(['uint256'], [0]),
                    { gasLimit: 2000000 },
                )
                await tx.wait()
            }

            // Move forward in time
            await timeTravel(deployer.provider, config.maci.signUpDurationInSeconds + 1)

            const onChainStateRoot = (await maciContract.getStateTreeRoot()).toString()
            const offChainStateRoot = maciState.genStateRoot().toString()
            expect(onChainStateRoot).toEqual(offChainStateRoot)
        })
    })

    describe('Publish messages', () => {
        it('The message root should be correct after publishing one message per user', async () => {
            stateRootBefore = maciState.genStateRoot()

            for (let user of users) {

                maciState.publishMessage(user.message, user.ephemeralKeypair.pubKey)

                const tx = await maciContract.publishMessage(
                    user.message.asContractParam(),
                    user.ephemeralKeypair.pubKey.asContractParam(),
                )
                const receipt = await tx.wait()
                expect(receipt.status).toEqual(1)
            }

            const onChainMessageRoot = (await maciContract.getMessageTreeRoot()).toString()
            const offChainMessageRoot = maciState.genMessageRoot().toString()
            expect(onChainMessageRoot).toEqual(offChainMessageRoot)
        })
    })

    describe('Process messages', () => {
        it('the blank state leaf hash should match the one generated by the contract', async () => {
            const temp = new IncrementalMerkleTree(voteOptionTreeDepth, bigInt(0))

            const emptyVoteOptionTreeRoot = temp.root

            const onChainHash = await maciContract.hashedBlankStateLeaf()
            const blankStateLeaf = StateLeaf.genBlankLeaf(
                emptyVoteOptionTreeRoot,
            )
            expect(onChainHash.toString()).toEqual(blankStateLeaf.hash().toString())
        })

        it('batchProcessMessage should verify a proof and update the postSignUpStateRoot', async () => {
            const randomStateLeaf = StateLeaf.genRandomLeaf()
            // Generate circuit inputs
            const circuitInputs = 
                maciState.genBatchUpdateStateTreeCircuitInputs(
                    0,
                    batchSize,
                    randomStateLeaf,
                )

            const circuit = await compileAndLoadCircuit('batchUpdateStateTree_test.circom')

            // Calculate the witness
            const witness = circuit.calculateWitness(circuitInputs)
            expect(circuit.checkWitness(witness)).toBeTruthy()

            // Get the circuit-generated root
            const idx = circuit.getSignalIdx('main.root')
            const circuitNewStateRoot = witness[idx].toString()

            // Process the batch of messages
            maciState.batchProcessMessage(
                0,
                batchSize,
                randomStateLeaf,
            )

            const stateRootAfter = maciState.genStateRoot()

            expect(stateRootBefore.toString()).not.toEqual(stateRootAfter)

            // After we run process the message via maciState.processMessage(),
            // the root generated by the circuit should match
            expect(circuitNewStateRoot.toString()).toEqual(stateRootAfter.toString())

            const publicSignals = genPublicSignals(witness, circuit)

            expect(publicSignals).toHaveLength(19)

            let ecdhPubKeys: PubKey[] = []
            for (let p of circuitInputs['ecdh_public_key']) {
                const pubKey = new PubKey(p)
                ecdhPubKeys.push(pubKey)
            }

            const stateRoot = maciState.genStateRoot().toString()
            const contractPublicSignals = await maciContract.genBatchUstPublicSignals(
                stateRoot,
                circuitInputs['state_tree_root'].map((x) => x.toString()),
                ecdhPubKeys.map((x) => x.asContractParam()),
            )

            expect(JSON.stringify(publicSignals.map((x) => x.toString()))).toEqual(
                JSON.stringify(contractPublicSignals.map((x) => x.toString()))
            )

            console.log('Generating proof...')
            const proof = await genProof(witness, batchUstPk)
            const isValid = verifyProof(batchUstVk, proof, publicSignals)
            expect(isValid).toBeTruthy()

            const formattedProof = formatProofForVerifierContract(proof)

            const tx = await maciContract.batchProcessMessage(
                stateRoot,
                circuitInputs['state_tree_root'].map((x) => x.toString()),
                ecdhPubKeys.map((x) => x.asContractParam()),
                formattedProof,
                { gasLimit: 2000000 },
            )

            const receipt = await tx.wait()
            expect(receipt.status).toEqual(1)

            const postSignUpStateRoot = await maciContract.postSignUpStateRoot()
            expect(postSignUpStateRoot.toString()).toEqual(stateRoot.toString())
        })
    })
})
