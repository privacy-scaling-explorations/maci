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
    genTallyResultCommitment,
} from 'maci-core'

import {
    compileAndLoadCircuit,
    loadPk,
    loadVk,
    genBatchUstProofAndPublicSignals,
    genQvtProofAndPublicSignals,
} from 'maci-circuits'

import {
    SnarkProvingKey,
    SnarkVerifyingKey,
    verifyProof,
    parseVerifyingKeyJson,
    genPublicSignals,
} from 'libsemaphore'

const batchUstVk: SnarkVerifyingKey = loadVk('batchUstVk')
const qvtVk: SnarkVerifyingKey = loadVk('qvtVk')

const accounts = genTestAccounts(5)
const deployer = genDeployer(accounts[0].privateKey)

const batchSize = config.maci.messageBatchSize
const stateTreeDepth = config.maci.merkleTrees.stateTreeDepth
const messageTreeDepth = config.maci.merkleTrees.messageTreeDepth
const voteOptionTreeDepth = config.maci.merkleTrees.voteOptionTreeDepth
const voteOptionsMaxIndex = config.maci.voteOptionsMaxLeafIndex
const numVoteOptions = 2 ** voteOptionTreeDepth
const quadVoteTallyBatchSize = config.maci.quadVoteTallyBatchSize

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

        // Create users, a command per user, and its associated key and message
        for (let i = 1; i < accounts.length; i++) {
            const keypair = new Keypair()
            const command = new Command(
                bigInt(1),
                keypair.pubKey,
                bigInt(0),
                bigInt(i),
                bigInt(i),
                genRandomSalt(),
            )

            const ephemeralKeypair = new Keypair()
            const signature = command.sign(keypair.privKey)
            const sharedKey = Keypair.genEcdhSharedKey(
                ephemeralKeypair.privKey,
                coordinator.pubKey,
            )
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

            const onChainStateRoot = (await maciContract.getStateTreeRoot()).toString()
            const offChainStateRoot = maciState.genStateRoot().toString()
            expect(onChainStateRoot).toEqual(offChainStateRoot)
        })
    })

    describe('Publish messages', () => {
        it('The message root should be correct after publishing one message per user', async () => {
            // Move forward in time
            await timeTravel(deployer.provider, config.maci.signUpDurationInSeconds + 1)

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
            expect((await maciContract.emptyVoteOptionTreeRoot()).toString()).toEqual(emptyVoteOptionTreeRoot.toString())
        })

        it('batchProcessMessage should verify a proof and update the postSignUpStateRoot', async () => {
            // Move forward in time
            await timeTravel(deployer.provider, config.maci.votingDurationInSeconds + 1)

            const randomStateLeaf = StateLeaf.genRandomLeaf()
            // Generate circuit inputs
            const circuitInputs = 
                maciState.genBatchUpdateStateTreeCircuitInputs(
                    0,
                    batchSize,
                    randomStateLeaf,
                )

            // Process the batch of messages
            maciState.batchProcessMessage(
                0,
                batchSize,
                randomStateLeaf,
            )

            const stateRootAfter = maciState.genStateRoot()

            const circuit = await compileAndLoadCircuit('test/batchUpdateStateTree_test.circom')

            // Calculate the witness
            const witness = circuit.calculateWitness(circuitInputs)
            expect(circuit.checkWitness(witness)).toBeTruthy()

            // Get the circuit-generated root
            const idx = circuit.getSignalIdx('main.root')
            const circuitNewStateRoot = witness[idx].toString()

            // After we run process the message via maciState.processMessage(),
            // the root generated by the circuit should change and now match
            // the one generated by the circuit
            expect(stateRootBefore.toString()).not.toEqual(stateRootAfter)
            expect(circuitNewStateRoot.toString()).toEqual(stateRootAfter.toString())

            console.log('Generating proof...')

            const { proof, publicSignals } = genBatchUstProofAndPublicSignals(witness)

            const isValid = verifyProof(batchUstVk, proof, publicSignals)
            expect(isValid).toBeTruthy()

            expect(publicSignals).toHaveLength(20)

            let ecdhPubKeys: PubKey[] = []
            for (let p of circuitInputs['ecdh_public_key']) {
                const pubKey = new PubKey(p)
                ecdhPubKeys.push(pubKey)
            }

            const numMessages = await maciContract.numMessages()
            const messageBatchSize = await maciContract.messageBatchSize()

            const contractPublicSignals = await maciContract.genBatchUstPublicSignals(
                '0x' + stateRootAfter.toString(16),
                circuitInputs['state_tree_root'].map((x) => x.toString()),
                ecdhPubKeys.map((x) => x.asContractParam()),
            )

            expect(JSON.stringify(publicSignals.map((x) => x.toString()))).toEqual(
                JSON.stringify(contractPublicSignals.map((x) => x.toString()))
            )

            const formattedProof = formatProofForVerifierContract(proof)
            //const formattedProof = [0, 0, 0, 0, 0, 0, 0, 0]

            const tx = await maciContract.batchProcessMessage(
                '0x' + stateRootAfter.toString(16),
                circuitInputs['state_tree_root'].map((x) => x.toString()),
                ecdhPubKeys.map((x) => x.asContractParam()),
                formattedProof,
                { gasLimit: 2000000 },
            )

            const receipt = await tx.wait()
            expect(receipt.status).toEqual(1)

            const postSignUpStateRoot = await maciContract.postSignUpStateRoot()
            expect(postSignUpStateRoot.toString()).toEqual(stateRootAfter.toString())
        })
    })

    describe('Tally votes', () => {
        it('should tally a batch of votes', async () => {
            const startIndex = bigInt(0)

            const tally = maciState.computeBatchVoteTally(startIndex, quadVoteTallyBatchSize)
            const newResultsSalt = genRandomSalt()
            const currentResultsSalt = bigInt(0)

            // Generate circuit inputs
            const circuitInputs 
                = maciState.genQuadVoteTallyCircuitInputs(
                    startIndex,
                    quadVoteTallyBatchSize,
                    currentResultsSalt,
                    newResultsSalt,
                )

            const circuit = await compileAndLoadCircuit('test/quadVoteTally_test.circom')
            const witness = circuit.calculateWitness(stringifyBigInts(circuitInputs))
            expect(circuit.checkWitness(witness)).toBeTruthy()

            const result = witness[circuit.getSignalIdx('main.newResultsCommitment')]

            const expectedCommitment = genTallyResultCommitment(tally, newResultsSalt, voteOptionTreeDepth)
            expect(result.toString()).toEqual(expectedCommitment.toString())

            console.log('Generating proof...')
            const { proof, publicSignals } = genQvtProofAndPublicSignals(witness)

            const contractPublicSignals = await maciContract.genQvtPublicSignals(
                circuitInputs.intermediateStateRoot.toString(),
                expectedCommitment.toString(),
            )

            expect(JSON.stringify(publicSignals.map((x) => x.toString()))).toEqual(
                JSON.stringify(contractPublicSignals.map((x) => x.toString()))
            )

            expect(publicSignals[0].toString()).toEqual(expectedCommitment.toString())
            expect(publicSignals[1].toString()).toEqual(maciState.genStateRoot().toString())
            expect(publicSignals[2].toString()).toEqual('0')
            expect(publicSignals[3].toString()).toEqual(circuitInputs.intermediateStateRoot.toString())
            expect(publicSignals[4].toString()).toEqual(circuitInputs.currentResultsCommitment.toString())

            const isValid = verifyProof(qvtVk, proof, publicSignals)
            expect(isValid).toBeTruthy()

            const formattedProof = formatProofForVerifierContract(proof)

            const tx = await maciContract.proveVoteTallyBatch(
                circuitInputs.intermediateStateRoot.toString(),
                expectedCommitment.toString(),
                tally.map((x) => x.toString()),
                newResultsSalt.toString(),
                formattedProof,
                { gasLimit: 1000000 },
            )

            const receipt = await tx.wait()
            expect(receipt.status).toEqual(1)
        })
    })
})
