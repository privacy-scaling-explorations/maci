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
    StateLeaf,
} from 'maci-domainobjs'

import { config } from 'maci-config'

import {
    G1Point,
    G2Point,
    stringifyBigInts,
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
    intStateTreeDepth: 2,
    messageTreeDepth: 2,
    messageTreeSubDepth: 2,
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
const circuit = 'processMessages_test'

describe('ProcessMessage circuit', () => {
    describe('1 user, 1 message', () => {
        const maciState = new MaciState()
        const voteWeight = BigInt(9)
        const voteOptionIndex = BigInt(0)
        let stateIndex
        let pollId
        let poll
        const messages: Message[] = []
        let messageTree

        beforeAll(async () => {
            const userKeypair = new Keypair()
            stateIndex = maciState.signUp(userKeypair.pubKey, voiceCreditBalance)

            maciState.stateAq.mergeSubRoots(0)
            maciState.stateAq.merge(STATE_TREE_DEPTH)

            // Sign up and publish
            pollId = maciState.deployPoll(
                duration,
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
            )

            const command = new Command(
                stateIndex,
                userKeypair.pubKey,
                voteOptionIndex,
                voteWeight,
                BigInt(1),
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
            messageTree.insert(message.hash())

            poll.publishMessage(message, ecdhKeypair.pubKey)

            poll.messageAq.mergeSubRoots(0)
            poll.messageAq.merge(treeDepths.messageTreeDepth)

            expect(messageTree.root.toString())
                .toEqual(
                    poll.messageAq.getRoot(
                        treeDepths.messageTreeDepth,
                    ).toString()
                )
        })

        it('should produce the correct state root', async () => {
            // Since `messages` has fewer elements than the batch size, pad it
            // with its last element until it does
            while (messages.length < messageBatchSize) {
                messages.push(messages[messages.length - 1])
            }

            const messageSubrootPath = messageTree.genMerkleSubrootPath(
                0,
                messageBatchSize,
            )

            const encPubKeys = poll.encPubKeys
            while(encPubKeys.length < messageBatchSize) {
                encPubKeys.push(encPubKeys[0])
            }

            debugger
            const circuitInputs = stringifyBigInts({
                currentStateRoot: maciState.stateAq.getRoot(STATE_TREE_DEPTH),
                msgRoot: poll.messageAq.getRoot(treeDepths.messageTreeDepth),
                msgs: messages.map((x) => x.asCircuitInputs()),
                msgSubrootPathElements: messageSubrootPath.pathElements,
                msgTreeZeroValue: poll.messageAq.zeroValue,
                batchStartIndex: 0,
                batchEndIndex: 0,
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.asCircuitInputs(),
                encPubKeys: encPubKeys.map((x) => x.asCircuitInputs()),
            })
            const witness = await genWitness(circuit, circuitInputs)
            expect(witness.length > 0).toBeTruthy()
        })
    })
})
