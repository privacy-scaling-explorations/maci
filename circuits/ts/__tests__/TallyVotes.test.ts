jest.setTimeout(1200000)
import {
    genWitness,
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
    VoteLeaf
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
        const maciState = new MaciState()
        const voteLeaf = new VoteLeaf(BigInt(9), BigInt(0))
        const voteOptionIndex = BigInt(0)
        let stateIndex
        let pollId
        let poll
        const messages: Message[] = []
        const commands: Command[] = []
        let messageTree

        beforeAll(async () => {
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

            messageTree = new IncrementalQuinTree(
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
                voteLeaf.pack(), // vote weight
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

            expect(newResults[Number(voteOptionIndex)][0]).toEqual(BigInt(voteLeaf.pos))
            expect(newResults[Number(voteOptionIndex)][1]).toEqual(BigInt(voteLeaf.neg))

            const witness = await genWitness(circuit, generatedInputs)
            expect(witness.length > 0).toBeTruthy()

            // TODO: test for the correct newTallyCommitment
        })
    })

    const NUM_BATCHES = 4
    const x = messageBatchSize * NUM_BATCHES

    describe(`${x} users, ${x} messages`, () => {
        it('should produce the correct state root and ballot root', async () => {
            const maciState = new MaciState()
            const userKeypairs: Keypair[] = []
            const stateIndices: BigInt[] = []
            for (let i = 0; i < x; i ++) {
                const k = new Keypair()
                const stateIndex = maciState.signUp(
                    k.pubKey,
                    voiceCreditBalance,
                    BigInt(Math.floor(Date.now() / 1000) + duration),
                )

                stateIndices.push(stateIndex)
                userKeypairs.push(k)
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
                const randomVoteWeight = Math.floor(Math.random() * 9) + 1
                const randomVoteType = randomVoteWeight % 2
                const pos = randomVoteType == 1 ? 0 : randomVoteWeight
                const neg = randomVoteType == 1 ? randomVoteWeight : 0
                const msgVoteLeaf = new VoteLeaf(BigInt(pos), BigInt(neg))

                const command = new Command(
                    stateIndices[i],
                    userKeypairs[i].pubKey,
                    BigInt(0), //vote option index
                    msgVoteLeaf.pack(), // vote weight
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

                console.log(generatedInputs)

                const witness = await genWitness(circuit, generatedInputs)
                expect(witness.length > 0).toBeTruthy()
            }
        })
    })
})
