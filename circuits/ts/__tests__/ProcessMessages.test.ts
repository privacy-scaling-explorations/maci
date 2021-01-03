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
    Ballot,
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


            const currentStateLeaves: StateLeaf[] = []
            const currentStateLeavesPathElements: any[] = []
            for (let i = 0; i < messageBatchSize; i ++) {
                // On the first batch, copy the state leaves from MaciState as
                // the Poll won't have those state leaves until the first
                // invocation of processMessages()
                currentStateLeaves.push(maciState.stateLeaves[stateIndex - 1])
                const path = maciState.stateTree.genMerklePath(stateIndex)
                currentStateLeavesPathElements.push(path.pathElements)
            }

            const emptyBallot = new Ballot(
                5 ** treeDepths.voteOptionTreeDepth,
                treeDepths.voteOptionTreeDepth,
            )
            const ballotTree = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                emptyBallot.hash(),
            )

            const currentBallots: Ballot[] = []
            const currentBallotsPathElements: any[] = []

            while (currentBallots.length < messageBatchSize) {
                currentBallots.push(emptyBallot)
            }

            for (const ballot of currentBallots) {
                ballotTree.insert(ballot.hash())
            }

            for (let i = 0; i < messageBatchSize; i ++) {
                const path = ballotTree.genMerklePath(stateIndex)
                currentBallotsPathElements.push(path.pathElements)
            }

            const circuitInputs = stringifyBigInts({
                //msgRoot: poll.messageAq.getRoot(treeDepths.messageTreeDepth),
                // TODO: figure out why this works
                msgRoot: 0,
                msgs: messages.map((x) => x.asCircuitInputs()),
                msgSubrootPathElements: messageSubrootPath.pathElements,
                batchStartIndex: 0,
                batchEndIndex: 0,
                msgTreeZeroValue: poll.messageAq.zeroValue,
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.asCircuitInputs(),
                encPubKeys: encPubKeys.map((x) => x.asCircuitInputs()),
                //currentStateRoot: maciState.stateAq.getRoot(STATE_TREE_DEPTH),
                //currentStateLeaves: currentStateLeaves.map((x) => x.asCircuitInputs()),
                //currentStateLeavesPathElements,
                //currentBallotRoot: ballotTree.root,
                //currentBallots: currentBallots.map((x) => x.asCircuitInputs()),
                //currentBallotsPathElements,
            })
            debugger

            const witness = await genWitness(circuit, circuitInputs)
            expect(witness.length > 0).toBeTruthy()

        })
    })
})
