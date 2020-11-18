jest.setTimeout(90000)
import * as ethers from 'ethers'
import { deployMaci, genDeployer, loadAbi } from '../deploy'
import {
    //StateLeaf,
    //Command,
    VerifyingKey,
    Keypair,
    PubKey,
    PrivKey,
} from 'maci-domainobjs'

import {
    MaciState,
    genProcessVkSig,
    genTallyVkSig,
} from 'maci-core'

import { config } from 'maci-config'
import { G1Point, G2Point, stringifyBigInts } from 'maci-crypto'

const STATE_TREE_DEPTH = 10
const STATE_TREE_ARITY = 5
import { genTestAccounts } from '../accounts'
const accounts = genTestAccounts(1)
const deployer = genDeployer(accounts[0].privateKey)
const coordinator = new Keypair(new PrivKey(BigInt(config.maci.coordinatorPrivKey)))
const pollAbi = loadAbi('Poll.abi')

const testProcessVk = new VerifyingKey(
    new G1Point(BigInt(0), BigInt(1)),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    [
        new G1Point(BigInt(0), BigInt(1)),
        new G1Point(BigInt(0), BigInt(1)),
    ],
)

const testTallyVk = new VerifyingKey(
    new G1Point(BigInt(2), BigInt(3)),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    [
        new G1Point(BigInt(0), BigInt(1)),
        new G1Point(BigInt(0), BigInt(1)),
    ],
)

const users = [
    new Keypair(),
    new Keypair(),
    new Keypair(),
]

const signUpTxOpts = { gasLimit: 200000 }

describe('MACI', () => {
    let maciContract
    let stateAqContract
    let vkRegistryContract

    describe('Deployment', () => {
        beforeAll(async () => {
            const r = await deployMaci(
                deployer,
            )
            maciContract = r.maciContract
            stateAqContract = r.stateAqContract
            vkRegistryContract = r.vkRegistryContract
        })

        it('MACI.stateTreeDepth should be correct', async () => {
            const std = await maciContract.stateTreeDepth()
            expect(std.toString()).toEqual(STATE_TREE_DEPTH.toString())
        })

        describe('Signups', () => {

            it('should sign up users', async () => {
                expect.assertions(users.length)

                for (const user of users) {
                    const tx = await maciContract.signUp(
                        user.pubKey.asContractParam(),
                        signUpTxOpts,
                    )
                    const receipt = await tx.wait()
                    expect(receipt.status).toEqual(1)
                    console.log('signUp() gas used:', receipt.gasUsed.toString())
                }
            })

            it('signUp() shold fail when given an invalid pubkey', async () => {
                try {
                    await maciContract.signUp(
                        {
                            x: '21888242871839275222246405745257275088548364400416034343698204186575808495617',
                            y: '0',
                        },
                    )
                } catch (e) {
                    const error = 'MACI: pubkey values should be less than the snark scalar field'
                    expect(e.message.endsWith(error)).toBeTruthy()
                }

            })
        })

        describe('Merge sign-ups', () => {
            it('coordinator should be able to merge the signUp AccQueue', async () => {
                let tx = await maciContract.mergeStateAqSubRoots(0)
                let receipt = await tx.wait()
                expect(receipt.status).toEqual(1)

                console.log('mergeStateAqSubRoots() gas used:', receipt.gasUsed.toString())

                tx = await maciContract.mergeStateAq()
                receipt = await tx.wait()
                expect(receipt.status).toEqual(1)

                console.log('mergeStateAq() gas used:', receipt.gasUsed.toString())
            })
        })

        describe('Deploy Polls', () => {
            // Poll parameters
            const duration = 10

            const maxValues = {
                maxUsers: 25,
                maxMessages: 25,
                maxVoteOptions: 25,
            }

            const treeDepths = {
                intStateTreeDepth: 1,
                messageTreeDepth: 2,
                voteOptionTreeDepth: 2,
            }

            const messageBatchSize = 5
            const tallyBatchSize = STATE_TREE_ARITY ** treeDepths.intStateTreeDepth

            let pollId: number

            it('should set VKs and deploy a poll', async () => {
                const std = await maciContract.stateTreeDepth()

                // Set VKs
                console.log('Setting VKs')
                let tx = await vkRegistryContract.setVerifyingKeys(
                    std.toString(),
                    treeDepths.intStateTreeDepth,
                    treeDepths.messageTreeDepth,
                    treeDepths.voteOptionTreeDepth,
                    messageBatchSize,
                    testProcessVk.asContractParam(),
                    testTallyVk.asContractParam(),
                )
                let receipt = await tx.wait()
                expect(receipt.status).toEqual(1)

                const pSig = await vkRegistryContract.genProcessVkSig(
                    std.toString(),
                    treeDepths.messageTreeDepth,
                    treeDepths.voteOptionTreeDepth,
                    messageBatchSize,
                )
                const isPSigSet = await vkRegistryContract.isProcessVkSet(pSig)
                expect(isPSigSet).toBeTruthy()

                const tSig = await vkRegistryContract.genTallyVkSig(
                    std.toString(),
                    treeDepths.intStateTreeDepth,
                    treeDepths.voteOptionTreeDepth,
                )
                const isTSigSet = await vkRegistryContract.isTallyVkSet(tSig)
                expect(isTSigSet).toBeTruthy()
                
                // Create the poll and get the poll ID from the tx event logs
                tx = await maciContract.deployPoll(
                    duration,
                    maxValues,
                    treeDepths,
                    messageBatchSize,
                    coordinator.pubKey.asContractParam(),
                    { gasLimit: 8000000 },
                )
                receipt = await tx.wait()

                console.log('deployPoll() gas used:', receipt.gasUsed.toString())

                expect(receipt.status).toEqual(1)
                const iface = new ethers.utils.Interface(maciContract.interface.abi)
                const event = iface.parseLog(receipt.logs[receipt.logs.length - 1])
                pollId = event.values._pollId
            })

            it('should set correct storage values', async () => {
                // Retrieve the Poll state and check that each value is correct
                const std = await maciContract.stateTreeDepth()
                const pollContractAddress = await maciContract.getPoll(pollId)
                const pollContract = new ethers.Contract(
                    pollContractAddress,
                    pollAbi,
                    deployer.signer,
                )

                const pollProcessVkSig = await pollContract.processVkSig()
                const pollTallyVkSig = await pollContract.tallyVkSig()

                const expectedProcessVkSig = genProcessVkSig(
                    std,
                    treeDepths.messageTreeDepth,
                    treeDepths.voteOptionTreeDepth,
                    messageBatchSize,
                )

                const expectedTallyVkSig = genTallyVkSig(
                    std,
                    treeDepths.intStateTreeDepth,
                    treeDepths.voteOptionTreeDepth,
                )

                expect(pollProcessVkSig.toString()).toEqual(expectedProcessVkSig.toString())
                expect(pollTallyVkSig.toString()).toEqual(expectedTallyVkSig.toString())

                const onChainProcessVk = VerifyingKey.fromContract(
                    await vkRegistryContract.getProcessVkBySig(pollProcessVkSig)
                )
                const onChainTallyVk = VerifyingKey.fromContract(
                    await vkRegistryContract.getTallyVkBySig(pollTallyVkSig)
                )
                expect(onChainProcessVk.equals(testProcessVk)).toBeTruthy()
                expect(onChainTallyVk.equals(testTallyVk)).toBeTruthy()

                /*
                    0. coordinatorPubKey,
                    1. duration,
                    2. processVkSig,
                    3. tallyVkSig,
                    4. messageAq,
                    5. maxValues,
                    6. treeDepths,
                    7. batchSizes
                 */

                const pollState = await pollContract.getState()

                expect(pollState[0].x.toString()).toEqual(coordinator.pubKey.rawPubKey[0].toString())
                expect(pollState[0].y.toString()).toEqual(coordinator.pubKey.rawPubKey[1].toString())

                expect(pollState[1].toString()).toEqual(duration.toString())

                expect(pollState[2].toString()).toEqual(pollProcessVkSig.toString())

                expect(pollState[3].toString()).toEqual(pollTallyVkSig.toString())

                expect(pollState[4].match(/^(0x)?[0-9a-fA-F]{40}$/) != null).toBeTruthy()

                expect(pollState[5].maxUsers.toString()).toEqual(maxValues.maxUsers.toString())
                expect(pollState[5].maxMessages.toString()).toEqual(maxValues.maxMessages.toString())
                expect(pollState[5].maxVoteOptions.toString()).toEqual(maxValues.maxVoteOptions.toString())

                expect(pollState[6].intStateTreeDepth.toString()).toEqual(treeDepths.intStateTreeDepth.toString())
                expect(pollState[6].messageTreeDepth.toString()).toEqual(treeDepths.messageTreeDepth.toString())
                expect(pollState[6].voteOptionTreeDepth.toString()).toEqual(treeDepths.voteOptionTreeDepth.toString())

                expect(pollState[7].messageBatchSize.toString()).toEqual(messageBatchSize.toString())
                expect(pollState[7].tallyBatchSize.toString()).toEqual(tallyBatchSize.toString())
            })
        })
    })
})
