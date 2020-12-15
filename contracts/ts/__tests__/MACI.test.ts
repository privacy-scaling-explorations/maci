jest.setTimeout(90000)
import * as ethers from 'ethers'
import { timeTravel } from './utils'
import { genDeployer, loadAbi } from '../deploy'
import { deployTestContracts } from '../utils'
import {
    Command,
    VerifyingKey,
    Keypair,
    PrivKey,
} from 'maci-domainobjs'

import {
    MaciState,
    genProcessVkSig,
    genTallyVkSig,
    MaxValues,
    TreeDepths,
} from 'maci-core'

import { config } from 'maci-config'
import {
    G1Point,
    G2Point,
} from 'maci-crypto'

const STATE_TREE_DEPTH = 10
const STATE_TREE_ARITY = 5
const MESSAGE_TREE_DEPTH = 4
const MESSAGE_TREE_SUBDEPTH = 2
import { genTestAccounts } from '../accounts'
const accounts = genTestAccounts(1)
const deployer = genDeployer(accounts[0].privateKey)
const coordinator = new Keypair(new PrivKey(BigInt(config.maci.coordinatorPrivKey)))
const pollAbi = loadAbi('Poll.abi')
const accQueueQuinaryMaciAbi = loadAbi('AccQueueQuinaryMaci.abi')

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

const maciState = new MaciState()


describe('MACI', () => {
    let maciContract
    let stateAqContract
    let vkRegistryContract
    let pollStateViewerContract
    let pollId: number

    describe('Deployment', () => {
        beforeAll(async () => {
            const r = await deployTestContracts(
                deployer,
                config.maci.initialVoiceCreditBalance,
            )
            maciContract = r.maciContract
            stateAqContract = r.stateAqContract
            vkRegistryContract = r.vkRegistryContract
            pollStateViewerContract = r.pollStateViewerContract
        })

        it('MACI.stateTreeDepth should be correct', async () => {
            const std = await maciContract.stateTreeDepth()
            expect(std.toString()).toEqual(STATE_TREE_DEPTH.toString())
        })

        describe('Signups', () => {

            it('should sign up users', async () => {
                expect.assertions(users.length * 2)

                const iface = new ethers.utils.Interface(maciContract.interface.abi)

                let i = 0
                for (const user of users) {
                    const tx = await maciContract.signUp(
                        user.pubKey.asContractParam(),
                        ethers.utils.defaultAbiCoder.encode(['uint256'], [1]),
                        ethers.utils.defaultAbiCoder.encode(['uint256'], [0]),
                        signUpTxOpts,
                    )
                    const receipt = await tx.wait()
                    expect(receipt.status).toEqual(1)
                    console.log('signUp() gas used:', receipt.gasUsed.toString())

                    // Store the state index
                    const event = iface.parseLog(receipt.logs[receipt.logs.length - 1])
                    expect(event.values._stateIndex.toString()).toEqual(i.toString())

                    maciState.signUp(
                        user.pubKey,
                        BigInt(event.values._voiceCreditBalance.toString()),
                    )

                    i ++
                }
            })

            it('signUp() shold fail when given an invalid pubkey', async () => {
                try {
                    await maciContract.signUp(
                        {
                            x: '21888242871839275222246405745257275088548364400416034343698204186575808495617',
                            y: '0',
                        },
                        ethers.utils.defaultAbiCoder.encode(['uint256'], [1]),
                        ethers.utils.defaultAbiCoder.encode(['uint256'], [0]),
                        signUpTxOpts,
                    )
                } catch (e) {
                    const error = 'MACI: _pubKey values should be less than the snark scalar field'
                    expect(e.message.endsWith(error)).toBeTruthy()
                }
            })
        })

        describe('Merge sign-ups', () => {
            it('coordinator should be able to merge the signUp AccQueue', async () => {
                let tx = await maciContract.mergeStateAqSubRoots(0, { gasLimit: 3000000 })
                let receipt = await tx.wait()
                expect(receipt.status).toEqual(1)

                console.log('mergeStateAqSubRoots() gas used:', receipt.gasUsed.toString())

                tx = await maciContract.mergeStateAq({ gasLimit: 3000000 })
                receipt = await tx.wait()
                expect(receipt.status).toEqual(1)

                console.log('mergeStateAq() gas used:', receipt.gasUsed.toString())

                maciState.stateAq.mergeSubRoots(0)
                maciState.stateAq.merge(STATE_TREE_DEPTH)
            })

            it('the state root must be correct', async () => {
                const onChainStateRoot = await stateAqContract.getMainRoot(STATE_TREE_DEPTH)
                expect(onChainStateRoot.toString()).toEqual(maciState.stateAq.mainRoots[STATE_TREE_DEPTH].toString())
            })
        })

        describe('Deploy a Poll', () => {
            // Poll parameters
            const duration = 15

            const maxValues: MaxValues = {
                maxUsers: 25,
                maxMessages: 25,
                maxVoteOptions: 25,
            }

            const treeDepths: TreeDepths = {
                intStateTreeDepth: 1,
                messageTreeDepth: MESSAGE_TREE_DEPTH,
                messageTreeSubDepth: MESSAGE_TREE_SUBDEPTH,
                voteOptionTreeDepth: 2,
            }

            const messageBatchSize = 5
            const tallyBatchSize = STATE_TREE_ARITY ** treeDepths.intStateTreeDepth

            it('should set VKs and deploy a poll', async () => {
                const std = await maciContract.stateTreeDepth()

                // TODO: update maciState
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
                    '0x0000000000000000000000000000000000000000',
                    { gasLimit: 8000000 },
                )
                receipt = await tx.wait()

                console.log('deployPoll() gas used:', receipt.gasUsed.toString())

                expect(receipt.status).toEqual(1)
                const iface = new ethers.utils.Interface(maciContract.interface.abi)
                const event = iface.parseLog(receipt.logs[receipt.logs.length - 1])
                pollId = event.values._pollId

                const p = maciState.deployPoll(
                    duration,
                    maxValues,
                    treeDepths,
                    messageBatchSize,
                    coordinator,
                )
                expect(p.toString()).toEqual(pollId.toString())
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

                const pollState = await pollStateViewerContract.getState(pollContract.address)

                expect(pollState[0].x.toString()).toEqual(coordinator.pubKey.rawPubKey[0].toString())
                expect(pollState[0].y.toString()).toEqual(coordinator.pubKey.rawPubKey[1].toString())

                expect(pollState[1].toString()).toEqual(duration.toString())

                expect(pollState[2].processVkSig.toString()).toEqual(pollProcessVkSig.toString())

                expect(pollState[2].tallyVkSig.toString()).toEqual(pollTallyVkSig.toString())

                expect(pollState[3].match(/^(0x)?[0-9a-fA-F]{40}$/) != null).toBeTruthy()

                expect(pollState[4].maxUsers.toString()).toEqual(maxValues.maxUsers.toString())
                expect(pollState[4].maxMessages.toString()).toEqual(maxValues.maxMessages.toString())
                expect(pollState[4].maxVoteOptions.toString()).toEqual(maxValues.maxVoteOptions.toString())

                expect(pollState[5].intStateTreeDepth.toString()).toEqual(treeDepths.intStateTreeDepth.toString())
                expect(pollState[5].messageTreeDepth.toString()).toEqual(treeDepths.messageTreeDepth.toString())
                expect(pollState[5].voteOptionTreeDepth.toString()).toEqual(treeDepths.voteOptionTreeDepth.toString())

                expect(pollState[6].messageBatchSize.toString()).toEqual(messageBatchSize.toString())
                expect(pollState[6].tallyBatchSize.toString()).toEqual(tallyBatchSize.toString())
            })
        })

        describe('Publish messages (vote + key-change)', () => {
            let pollContract

            beforeAll(async () => {
                const pollContractAddress = await maciContract.getPoll(pollId)
                pollContract = new ethers.Contract(
                    pollContractAddress,
                    pollAbi,
                    deployer.signer,
                )

            })

            it('should publish a message to the Poll contract', async () => {
                const keypair = new Keypair()

                const command = new Command(
                    BigInt(0),
                    keypair.pubKey,
                    BigInt(0),
                    BigInt(0),
                    BigInt(0),
                    BigInt(pollId),
                    BigInt(0),
                )

                const signature = command.sign(keypair.privKey)
                const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey)
                const message = command.encrypt(signature, sharedKey)
                const tx = await pollContract.publishMessage(
                    message.asContractParam(),
                    keypair.pubKey.asContractParam(),
                )
                const receipt = await tx.wait()
                console.log('publishMessage() gas used:', receipt.gasUsed.toString())
                expect(receipt.status).toEqual(1)

                maciState.polls[pollId].publishMessage(message, keypair.pubKey)
            })

            it('shold not publish a message after the voting period', async () => {
                const duration = await pollContract.duration()
                await timeTravel(deployer.provider, Number(duration.toString()) + 1)

                const keypair = new Keypair()
                const command = new Command(
                    BigInt(0),
                    keypair.pubKey,
                    BigInt(0),
                    BigInt(0),
                    BigInt(0),
                    BigInt(pollId),
                    BigInt(0),
                )

                const signature = command.sign(keypair.privKey)
                const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey)
                const message = command.encrypt(signature, sharedKey)
                try {
                    await pollContract.publishMessage(
                        message.asContractParam(),
                        keypair.pubKey.asContractParam(),
                        { gasLimit: 300000 },
                    )
                } catch (e) {
                    const error = 'PollE04'
                    expect(e.message.endsWith(error)).toBeTruthy()
                }
            })

        })

        describe('Merge messages', () => {
            let pollContract
            let messageAqContract

            beforeAll(async () => {
                const pollContractAddress = await maciContract.getPoll(pollId)
                pollContract = new ethers.Contract(
                    pollContractAddress,
                    pollAbi,
                    deployer.signer,
                )

                const messageAqAddress = await pollContract.messageAq()
                messageAqContract = new ethers.Contract(
                    messageAqAddress,
                    accQueueQuinaryMaciAbi,
                    deployer.signer,
                )
            })

            it('coordinator should be able to merge the message AccQueue', async () => {
                let tx = await pollContract.mergeMessageAqSubRoots(0, { gasLimit: 3000000 })
                let receipt = await tx.wait()
                expect(receipt.status).toEqual(1)

                maciState.polls[pollId].messageAq.mergeSubRoots(0)
                console.log('mergeMessageAqSubRoots() gas used:', receipt.gasUsed.toString())

                tx = await pollContract.mergeMessageAq({ gasLimit: 4000000 })
                receipt = await tx.wait()
                expect(receipt.status).toEqual(1)
                maciState.polls[pollId].messageAq.merge(MESSAGE_TREE_DEPTH)

                console.log('mergeMessageAq() gas used:', receipt.gasUsed.toString())
            })

            it('the message root must be correct', async () => {
                const onChainMessageRoot = await messageAqContract.getMainRoot(MESSAGE_TREE_DEPTH)
                expect(onChainMessageRoot.toString())
                    .toEqual(maciState.polls[pollId].messageAq.mainRoots[MESSAGE_TREE_DEPTH].toString())
            })
        })
    })
})
