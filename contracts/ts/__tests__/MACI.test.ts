jest.setTimeout(90000)
import * as ethers from 'ethers'
import { timeTravel } from './utils'
import { genDeployer, loadAbi } from '../deploy'
import { deployTestContracts } from '../utils'
import { genMaciStateFromContract } from '../genMaciState'
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
import { G1Point, G2Point } from 'maci-crypto'
import { genTestAccounts } from '../accounts'

const STATE_TREE_DEPTH = 10
const STATE_TREE_ARITY = 5
const MESSAGE_TREE_DEPTH = 4
const MESSAGE_TREE_SUBDEPTH = 2

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

const signUpTxOpts = { gasLimit: 300000 }

const maciState = new MaciState()

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

const messageBatchSize = 25
const tallyBatchSize = STATE_TREE_ARITY ** treeDepths.intStateTreeDepth


describe('MACI', () => {
    let maciContract
    let stateAqContract
    let vkRegistryContract
    let pptContract
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
            pptContract = r.pptContract
        })

        it('MACI.stateTreeDepth should be correct', async () => {
            const std = await maciContract.stateTreeDepth()
            expect(std.toString()).toEqual(STATE_TREE_DEPTH.toString())
        })
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
                expect(event.values._stateIndex.toString()).toEqual((i).toString())

                maciState.signUp(
                    user.pubKey,
                    BigInt(event.values._voiceCreditBalance.toString()),
                    BigInt(event.values._timestamp.toString()),
                )

                i ++
            }
        })

        it('signUp() shold fail when given an invalid pubkey', async () => {
            expect.assertions(1)
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

    describe('Merging sign-ups should fail because of onlyPoll', () => {
        it('coordinator should not be able to merge the signUp AccQueue', async () => {
            try {
                await maciContract.mergeStateAqSubRoots(0, 0, { gasLimit: 3000000 })
            } catch (e) {
                const error = 'MACI: only a Poll contract can call this function'
                expect(e.message.endsWith(error)).toBeTruthy()
            }

            try {
                await maciContract.mergeStateAq(0, { gasLimit: 3000000 })
            } catch (e) {
                const error = 'MACI: only a Poll contract can call this function'
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })
    })

    describe('Deploy a Poll', () => {
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
                { gasLimit: 1000000 },
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
                coordinator.pubKey.asContractParam(),
                pptContract.address,
                { gasLimit: 8000000 },
            )
            receipt = await tx.wait()

            console.log('deployPoll() gas used:', receipt.gasUsed.toString())

            expect(receipt.status).toEqual(1)
            const iface = new ethers.utils.Interface(maciContract.interface.abi)
            const event = iface.parseLog(receipt.logs[receipt.logs.length - 1])
            pollId = event.values._pollId

            const pollContractAddress = await maciContract.getPoll(pollId)
            const pollContract = new ethers.Contract(
                pollContractAddress,
                pollAbi,
                deployer.signer,
            )
            const deployTime = await pollContract.deployTime()
            const pollEndTimestamp = BigInt(duration + deployTime)

            const p = maciState.deployPoll(
                duration,
                pollEndTimestamp,
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

            //0. coordinatorPubKey,
            //1. duration,
            //2. processVkSig,
            //3. tallyVkSig,
            //4. messageAq,
            //5. maxValues,
            //6. treeDepths,
            //7. batchSizes
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
                BigInt(1),
                keypair.pubKey,
                BigInt(0),
                BigInt(9),
                BigInt(1),
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
            expect.assertions(1)
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
                const error = 'PollE03'
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
            console.log('mergeMessageAqSubRoots() gas used:', receipt.gasUsed.toString())

            tx = await pollContract.mergeMessageAq({ gasLimit: 4000000 })
            receipt = await tx.wait()
            expect(receipt.status).toEqual(1)

            const poll = maciState.polls[pollId]
            poll.messageAq.mergeSubRoots(0)
            poll.messageAq.merge(MESSAGE_TREE_DEPTH)

            console.log('mergeMessageAq() gas used:', receipt.gasUsed.toString())
        })

        it('the message root must be correct', async () => {
            const onChainMessageRoot = await messageAqContract.getMainRoot(MESSAGE_TREE_DEPTH)
            expect(onChainMessageRoot.toString())
                .toEqual(maciState.polls[pollId].messageAq.mainRoots[MESSAGE_TREE_DEPTH].toString())
        })
    })

    describe('Tally votes (negative test)', () => {
        expect.assertions(1)
        it('tallyVotes() should fail as the messages have not been processed yet', async () => {
            const pollContractAddress = await maciContract.getPoll(pollId)
            try {
                await pptContract.tallyVotes(
                    pollContractAddress,
                    0,
                    [0, 0, 0, 0, 0, 0, 0, 0],
                )
            } catch (e) {
                const error = 'PptE07'
                expect(e.message.endsWith(error)).toBeTruthy()
            }

        })
    })

    describe('Process messages (negative test)', () => {
        it('processMessages() should fail if the state AQ has not been merged', async () => {
            try {
                const pollContractAddress = await maciContract.getPoll(pollId)

                // Submit the proof
                await pptContract.processMessages(
                    pollContractAddress,
                    0,
                    [0, 0, 0, 0, 0, 0, 0, 0],
                )

            } catch (e) {
                expect(e.message.endsWith('PptE09')).toBeTruthy()
            }
        })
    })

    describe('Merge sign-ups as the Poll', () => {
        let pollContract

        beforeAll(async () => {
            const pollContractAddress = await maciContract.getPoll(pollId)
            pollContract = new ethers.Contract(
                pollContractAddress,
                pollAbi,
                deployer.signer,
            )

        })

        it('The Poll should be able to merge the signUp AccQueue', async () => {
            let tx = await pollContract.mergeMaciStateAqSubRoots(
                0,
                pollId,
                { gasLimit: 3000000 },
            )
            let receipt = await tx.wait()
            expect(receipt.status).toEqual(1)

            tx = await pollContract.mergeMaciStateAq(
                pollId,
                { gasLimit: 3000000 },
            )
            receipt = await tx.wait()
            expect(receipt.status).toEqual(1)

            maciState.stateAq.mergeSubRoots(0)
            maciState.stateAq.merge(STATE_TREE_DEPTH)
        })

        it('the state root must be correct', async () => {
            const onChainStateRoot = await stateAqContract.getMainRoot(STATE_TREE_DEPTH)
            expect(onChainStateRoot.toString()).toEqual(maciState.stateAq.mainRoots[STATE_TREE_DEPTH].toString())
        })
    })

    describe('Process messages', () => {
        let pollContract
        let poll
        let generatedInputs

        beforeAll(async () => {
            const pollContractAddress = await maciContract.getPoll(pollId)
            pollContract = new ethers.Contract(
                pollContractAddress,
                pollAbi,
                deployer.signer,
            )

            poll = maciState.polls[pollId]
            generatedInputs = poll.processMessages(pollId)
        })

        it('genProcessMessagesPackedVals() should generate the correct value', async () => {
            const packedVals = MaciState.packProcessMessageSmallVals(
                maxValues.maxVoteOptions,
                poll.stateTree.leaves.length,
                0,
                maciState.polls[pollId].messageTree.leaves.length - 1,
            )
            const onChainPackedVals = BigInt(
                await pptContract.genProcessMessagesPackedVals(
                    pollContract.address,
                    users.length,
                )
            )
            expect(packedVals.toString(16)).toEqual(onChainPackedVals.toString(16))
        })

        it('processMessages() should update the state and ballot root commitment', async () => {
            const pollContractAddress = await maciContract.getPoll(pollId)

            // Submit the proof
            const tx = await pptContract.processMessages(
                pollContractAddress,
                generatedInputs.newSbCommitment,
                [0, 0, 0, 0, 0, 0, 0, 0],
            )

            const receipt = await tx.wait()
            expect(receipt.status).toEqual(1)

            const processingComplete = await pptContract.processingComplete()
            expect(processingComplete).toBeTruthy()

            const onChainNewSbCommitment = await pptContract.sbCommitment()
            expect(generatedInputs.newSbCommitment).toEqual(onChainNewSbCommitment.toString())
        })
    })

    describe('Tally votes', () => {
        let pollContract

        beforeAll(async () => {
            const pollContractAddress = await maciContract.getPoll(pollId)
            pollContract = new ethers.Contract(
                pollContractAddress,
                pollAbi,
                deployer.signer,
            )
        })

        it('genTallyVotesPackedVals() should generate the correct value', async () => {
            const onChainPackedVals = BigInt(
                await pptContract.genTallyVotesPackedVals(
                    pollContract.address
                )
            )
            const packedVals = MaciState.packTallyVotesSmallVals(
                0,
                tallyBatchSize,
                users.length
            )
            expect(onChainPackedVals.toString()).toEqual(packedVals.toString())
        })

        it('tallyVotes() should update the tally commitment', async () => {
            expect.assertions(3)
            const poll = maciState.polls[pollId]
            const generatedInputs = poll.tallyVotes(pollId)

            const pollContractAddress = await maciContract.getPoll(pollId)
            const tx = await pptContract.tallyVotes(
                pollContractAddress,
                generatedInputs.newTallyCommitment,
                [0, 0, 0, 0, 0, 0, 0, 0],
            )

            const receipt = await tx.wait()
            expect(receipt.status).toEqual(1)

            const onChainNewTallyCommitment = await pptContract.tallyCommitment()

            expect(generatedInputs.newTallyCommitment).toEqual(onChainNewTallyCommitment.toString())

            try {
                await pptContract.tallyVotes(
                    pollContractAddress,
                    generatedInputs.newTallyCommitment,
                    [0, 0, 0, 0, 0, 0, 0, 0],
                )
            } catch (e) {
                const error = 'PptE08'
                expect(e.message.endsWith(error)).toBeTruthy()
            }
        })
    })

    describe('Generate MaciState from contract', () => {
        it('Should regenerate MaciState from on-chain information', async () => {
            const ms = await genMaciStateFromContract(
                deployer.provider,
                maciContract.address,
                coordinator,
                0,
            )

            // TODO: check roots
        })
    })
})
