jest.setTimeout(1200000)
import {
    genWitness,
    getSignalByName,
} from './utils'

import {
    MaciState,
    STATE_TREE_DEPTH,
} from 'maci-core'

import {
    Keypair,
    Command,
    Message,
    VerifyingKey,
} from 'maci-domainobjs'

import {
    hash5,
    G1Point,
    G2Point,
    IncrementalQuinTree,
} from 'maci-crypto'

const voiceCreditBalance = BigInt(100)

const duration = 30
const maxValues = {
    maxUsers: 25,
    maxMessages: 25,
    maxVoteOptions: 25,
}

const treeDepths = {
    intStateTreeDepth: 1,
    messageTreeDepth: 2,
    messageTreeSubDepth: 1,
    voteOptionTreeDepth: 2,
}

const messageBatchSize = 5

const testProcessVk = new VerifyingKey(
    new G1Point(BigInt(0), BigInt(1)),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    new G2Point([BigInt(3), BigInt(0)], [BigInt(1), BigInt(1)]),
    new G2Point([BigInt(4), BigInt(0)], [BigInt(1), BigInt(1)]),
    [
        new G1Point(BigInt(5), BigInt(1)),
        new G1Point(BigInt(6), BigInt(1)),
    ],
)

const testTallyVk = new VerifyingKey(
    new G1Point(BigInt(2), BigInt(3)),
    new G2Point([BigInt(3), BigInt(0)], [BigInt(3), BigInt(1)]),
    new G2Point([BigInt(4), BigInt(0)], [BigInt(3), BigInt(1)]),
    new G2Point([BigInt(5), BigInt(0)], [BigInt(4), BigInt(1)]),
    [
        new G1Point(BigInt(6), BigInt(1)),
        new G1Point(BigInt(7), BigInt(1)),
    ],
)

const coordinatorKeypair = new Keypair()
const circuit = 'tallyVotes_test'

describe('TallyVotes circuit', () => {
    describe('1 user, 2 messages', () => {
        let stateIndex
        let pollId
        let poll
        let maciState
        const voteWeight = BigInt(9)
        const voteOptionIndex = BigInt(0)

        beforeEach(async () => {
            maciState = new MaciState()
            const messages: Message[] = []
            const commands: Command[] = []
            // Sign up and publish
            const userKeypair = new Keypair()
            stateIndex = maciState.signUp(
                userKeypair.pubKey,
                voiceCreditBalance,
                BigInt(Math.floor(Date.now() / 1000)),
            )

            maciState.stateAq.mergeSubRoots(0)
            maciState.stateAq.merge(STATE_TREE_DEPTH)

            pollId = maciState.deployPoll(
                duration,
                BigInt(Math.floor(Date.now() / 1000) + duration),
                maxValues,
                treeDepths,
                messageBatchSize,
                coordinatorKeypair,
                testProcessVk,
                testTallyVk,
            )

            poll = maciState.polls[pollId]

            const messageTree = new IncrementalQuinTree(
                treeDepths.messageTreeDepth,
                poll.messageAq.zeroValue,
                5,
                hash5,
            )

            // First command (valid)
            const command = new Command(
                stateIndex,
                userKeypair.pubKey,
                voteOptionIndex, // voteOptionIndex,
                voteWeight, // vote weight
                BigInt(1), // nonce
                BigInt(pollId),
            )

            const signature = command.sign(userKeypair.privKey)

            const ecdhKeypair = new Keypair()
            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                coordinatorKeypair.pubKey,
            )
            const message = command.encrypt(signature, sharedKey)
            messages.push(message)
            commands.push(command)
            messageTree.insert(message.hash(ecdhKeypair.pubKey))

            poll.publishMessage(message, ecdhKeypair.pubKey)

            poll.messageAq.mergeSubRoots(0)
            poll.messageAq.merge(treeDepths.messageTreeDepth)

            expect(messageTree.root.toString())
                .toEqual(
                    poll.messageAq.getRoot(
                        treeDepths.messageTreeDepth,
                    ).toString()
                )
            // Process messages
            poll.processMessages()
        })

        it('should produce the correct result commitments', async () => {

            const generatedInputs = poll.tallyVotes()
            const newResults = poll.results

            expect(newResults[Number(voteOptionIndex)]).toEqual(voteWeight)

            const witness = await genWitness(circuit, generatedInputs)
            expect(witness.length > 0).toBeTruthy()

            const newTallyCommitment = await getSignalByName(circuit, witness, 'main.newTallyCommitment')
            const currentTallyCommitment = await getSignalByName(circuit, witness, 'main.currentTallyCommitment')
            expect(generatedInputs.newTallyCommitment).toEqual(newTallyCommitment.toString())
            expect(generatedInputs.currentTallyCommitment).toEqual(currentTallyCommitment.toString())
        })

        it('should produce the correct result if the inital tally is not zero', async () => {
            const generatedInputs = poll.tallyVotes()
            //const newResults = poll.results

            // TODO: show that check constraint fails
            /*
            generatedInputs.currentTallyCommitment = hash3(
                [
                    poll.genResultsCommitment(BigInt(1)),
                    poll.genSpentVoiceCreditSubtotalCommitment(
                        BigInt(2),
                        1
                    ),
                    poll.genPerVOSpentVoiceCreditsCommitment(
                        BigInt(3),
                        1,
                    )
                ]
            ).toString()
            */

            // Start the tally from non-zero value
            const randIdx = Math.floor(Math.random() * (generatedInputs.currentResults.length - 1))
            generatedInputs.currentResults[randIdx] = '1'
            const witness = await genWitness(circuit, generatedInputs)
            expect(witness.length > 0).toBeTruthy()


            for (let j = 0; j < messageBatchSize; j++){
                const curr = await getSignalByName(circuit, witness, `main.resultCalc[${randIdx}].nums[${j}]`)
                expect(Number(curr)).toEqual(0)
            }

            for (let i = 1; i < (5 ** treeDepths.voteOptionTreeDepth) * messageBatchSize; i++) {
                const voiceCreditSubtotal = await getSignalByName(circuit, witness, `main.newSpentVoiceCreditSubtotal.sums[${i}]`)

                if (i > (5 ** treeDepths.voteOptionTreeDepth) - 1) {
                    expect(Number(voiceCreditSubtotal)).toEqual(Number(voteWeight) ** 2)
                } else {
                    expect(Number(voiceCreditSubtotal)).toEqual(0)
                }
            }
        })
    })

    const NUM_BATCHES = 2
    const x = messageBatchSize * NUM_BATCHES

    describe(`${x} users, ${x} messages`, () => {
        it('should produce the correct state root and ballot root', async () => {
            const maciState = new MaciState()
            const userKeypairs: Keypair[] = []
            for (let i = 0; i < x; i ++) {
                const k = new Keypair()
                userKeypairs.push(k)
                maciState.signUp(
                    k.pubKey,
                    voiceCreditBalance,
                    BigInt(Math.floor(Date.now() / 1000) + duration),
                )
            }

            maciState.stateAq.mergeSubRoots(0)
            maciState.stateAq.merge(STATE_TREE_DEPTH)

            const pollId = maciState.deployPoll(
                duration,
                BigInt(Math.floor(Date.now() / 1000) + duration),
                maxValues,
                treeDepths,
                messageBatchSize,
                coordinatorKeypair,
                testProcessVk,
                testTallyVk,
            )

            const poll = maciState.polls[pollId]

            const numMessages = messageBatchSize * NUM_BATCHES
            for (let i = 0; i < numMessages; i ++) {
                const command = new Command(
                    BigInt(i),
                    userKeypairs[i].pubKey,
                    BigInt(i), //vote option index
                    BigInt(1), // vote weight
                    BigInt(1), // nonce
                    BigInt(pollId),
                )

                const signature = command.sign(userKeypairs[i].privKey)

                const ecdhKeypair = new Keypair()
                const sharedKey = Keypair.genEcdhSharedKey(
                    ecdhKeypair.privKey,
                    coordinatorKeypair.pubKey,
                )
                const message = command.encrypt(signature, sharedKey)
                poll.publishMessage(message, ecdhKeypair.pubKey)
            }

            poll.messageAq.mergeSubRoots(0)
            poll.messageAq.merge(treeDepths.messageTreeDepth)

            for (let i = 0; i < NUM_BATCHES; i ++) {
                poll.processMessages()
            }

            for (let i = 0; i < NUM_BATCHES; i ++) {
                const generatedInputs = poll.tallyVotes()

                // For the 0th batch, the circuit should ignore currentResults,
                // currentSpentVoiceCreditSubtotal, and
                // currentPerVOSpentVoiceCredits
                if (i === 0) {
                    generatedInputs.currentResults[0] = '123'
                    generatedInputs.currentSpentVoiceCreditSubtotal = '456'
                    generatedInputs.currentPerVOSpentVoiceCredits[0] = '789'
                }

                const witness = await genWitness(circuit, generatedInputs)
                expect(witness.length > 0).toBeTruthy()

            }
        })
    })
})
