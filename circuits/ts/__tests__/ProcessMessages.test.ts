jest.setTimeout(1200000)
import * as fs from 'fs'
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

import {
    G1Point,
    G2Point,
    stringifyBigInts,
    IncrementalQuinTree,
    genRandomSalt,
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
    describe('1 user, 2 messages', () => {
        const maciState = new MaciState()
        const voteWeight = BigInt(9)
        const voteOptionIndex = BigInt(0)
        let stateIndex
        let pollId
        let poll
        const messages: Message[] = []
        const commands: Command[] = []
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
                BigInt(0),
                BigInt(2),
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
            messageTree.insert(message.hash())

            poll.publishMessage(message, ecdhKeypair.pubKey)

            // Second command
            const command2 = new Command(
                stateIndex,
                userKeypair.pubKey,
                voteOptionIndex,
                voteWeight,
                BigInt(1),
                BigInt(pollId),
            )
            const signature2 = command2.sign(userKeypair.privKey)

            const ecdhKeypair2 = new Keypair()
            const sharedKey2 = Keypair.genEcdhSharedKey(
                ecdhKeypair2.privKey,
                coordinatorKeypair.pubKey,
            )
            const message2 = command2.encrypt(signature2, sharedKey2)
            messages.push(message2)
            commands.push(command2)
            messageTree.insert(message2.hash())

            poll.publishMessage(message2, ecdhKeypair2.pubKey)

            poll.messageAq.mergeSubRoots(0)
            poll.messageAq.merge(treeDepths.messageTreeDepth)

            expect(messageTree.root.toString())
                .toEqual(
                    poll.messageAq.getRoot(
                        treeDepths.messageTreeDepth,
                    ).toString()
                )
        })

        it('should produce the correct state root and ballot root', async () => {
            // Since `messages` has fewer elements than the batch size, pad it
            // with its last element until it does
            while (messages.length < messageBatchSize) {
                messages.push(messages[messages.length - 1])
            }
            while (commands.length < messageBatchSize) {
                commands.push(commands[commands.length - 1])
            }

            const messageSubrootPath = messageTree.genMerkleSubrootPath(
                0,
                messageBatchSize,
            )

            const encPubKeys = poll.encPubKeys.map((x) => x.copy())
            while(encPubKeys.length < messageBatchSize) {
                encPubKeys.push(encPubKeys[encPubKeys.length - 1])
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

            const currentVoteWeights: BigInt[] = []
            const currentVoteWeightsPathElements: any[] = []

            const newVoteOptionTreeRoots: BigInt[] = []
            const newVoteWeightsPathElements: any[] = []

            for (let i = 0; i < commands.length; i ++) {
                // For each command, create a vote option tree from the Ballot
                // it refers to, and update the vote option tree
                const ballot = currentBallots[Number(commands[i].stateIndex) - 1]
                const voteOptionTree = new IncrementalQuinTree(
                    ballot.voteOptionTreeDepth,
                    BigInt(0),
                )
                for (const vote of ballot.votes) {
                    voteOptionTree.insert(vote)
                }

                // Compute the Merkle path from the root to the vote.
                const currentPath = voteOptionTree.genMerklePath(
                    Number(commands[i].voteOptionIndex)
                )
                currentVoteWeights.push(ballot.votes[Number(commands[i].voteOptionIndex)])
                currentVoteWeightsPathElements.push(currentPath.pathElements)

                voteOptionTree.update(
                    Number(commands[i].voteOptionIndex),
                    commands[i].newVoteWeight,
                )

                const newPath = voteOptionTree.genMerklePath(
                    Number(commands[i].voteOptionIndex)
                )
                newVoteOptionTreeRoots.push(voteOptionTree.root)
                newVoteWeightsPathElements.push(newPath.pathElements)
            }

            const zerothStateLeaf = StateLeaf.genRandomLeaf()
            const zerothStateLeafHash = zerothStateLeaf.hash()

            const zerothBallot = Ballot.genRandomBallot(
                maxValues.maxVoteOptions,
                treeDepths.voteOptionTreeDepth,
            )
            zerothBallot.nonce = genRandomSalt()
            const zerothBallotHash = zerothBallot.hash()

            // The current roots
            const currentStateRoot = poll.stateTree.root
            const currentBallotRoot = poll.ballotTree.root

            const generatedInputs = poll.genProcessMessagesCircuitInputs(
                0,
                zerothStateLeaf,
                zerothBallot,
                maciState,
            )

            poll.processMessages(
                pollId,
                zerothStateLeaf,
                zerothBallot,
                maciState,
            )

            const zerothStateLeafPathElements = poll.stateTree.genMerklePath(0).pathElements
            const zerothBallotPathElements = poll.ballotTree.genMerklePath(0).pathElements

            // The new roots, which should differ
            const newStateRoot = poll.stateTree.root
            const newBallotRoot = poll.ballotTree.root
            expect(newStateRoot.toString()).not.toEqual(currentStateRoot.toString())
            expect(newBallotRoot.toString()).not.toEqual(currentBallotRoot.toString())

            const circuitInputs = stringifyBigInts({
                msgRoot: poll.messageAq.getRoot(treeDepths.messageTreeDepth),
                msgs: messages.map((x) => x.asCircuitInputs()),
                msgSubrootPathElements: messageSubrootPath.pathElements,
                batchStartIndex: 0,
                batchEndIndex: 1,
                msgTreeZeroValue: poll.messageAq.zeroValue,
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.asCircuitInputs(),
                encPubKeys: encPubKeys.map((x) => x.asCircuitInputs()),
                currentStateRoot: maciState.stateAq.getRoot(STATE_TREE_DEPTH),
                currentStateLeaves: currentStateLeaves.map((x) => x.asCircuitInputs()),
                currentStateLeavesPathElements,
                currentBallotRoot: ballotTree.root,
                currentBallots: currentBallots.map((x) => x.asCircuitInputs()),
                currentBallotsPathElements,
                maxVoteOptions: poll.maxValues.maxVoteOptions,
                maxUsers: poll.maxValues.maxUsers,
                currentVoteWeights,
                currentVoteWeightsPathElements,
                newVoteOptionTreeRoots,
                newVoteWeightsPathElements,
                zerothStateLeafHash,
                zerothStateLeafPathElements,
                zerothBallotHash,
                zerothBallotPathElements,
            })

            expect(circuitInputs.msgRoot).toEqual(generatedInputs.msgRoot)
            expect(circuitInputs.msgs.length).toEqual(generatedInputs.msgs.length)
            for (let i = 0; i < circuitInputs.msgs.length; i ++) {
                for (let j = 0; j < Message.DATA_LENGTH + 1; j ++) {
                    expect(circuitInputs.msgs[i][j].toString()).toEqual(generatedInputs.msgs[i][j].toString())
                }
            }

            const witness = await genWitness(circuit, generatedInputs)
            expect(witness.length > 0).toBeTruthy()

            const circuitNewStateRoot = await getSignalByName(circuit, witness, 'main.newStateRoot')
            expect(circuitNewStateRoot.toString()).toEqual(newStateRoot.toString())
            const circuitNewBallotRoot = await getSignalByName(circuit, witness, 'main.newBallotRoot')
            expect(circuitNewBallotRoot.toString()).toEqual(newBallotRoot.toString())
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.msgSubrootPathElements))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.msgSubrootPathElements))
            )
            expect(circuitInputs.batchStartIndex).toEqual(generatedInputs.batchStartIndex)
            expect(circuitInputs.batchEndIndex).toEqual(generatedInputs.batchEndIndex)
            expect(circuitInputs.msgTreeZeroValue.toString()).toEqual(generatedInputs.msgTreeZeroValue.toString())
            expect(circuitInputs.coordPrivKey.toString()).toEqual(generatedInputs.coordPrivKey.toString())
            expect(circuitInputs.coordPubKey.toString()).toEqual(generatedInputs.coordPubKey.toString())
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.encPubKeys))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.encPubKeys))
            )
            expect(circuitInputs.currentStateRoot.toString()).toEqual(generatedInputs.currentStateRoot.toString())
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.currentStateLeaves))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.currentStateLeaves))
            )
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.currentStateLeavesPathElements))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.currentStateLeavesPathElements))
            )
            expect(circuitInputs.currentBallotRoot.toString()).toEqual(generatedInputs.currentBallotRoot.toString())
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.currentBallotsPathElements))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.currentBallotsPathElements))
            )
            expect(circuitInputs.maxVoteOptions.toString()).toEqual(generatedInputs.maxVoteOptions.toString())
            expect(circuitInputs.maxUsers.toString()).toEqual(generatedInputs.maxUsers.toString())
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.currentVoteWeights))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.currentVoteWeights))
            )
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.currentVoteWeightsPathElements))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.currentVoteWeightsPathElements))
            )
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.newVoteOptionTreeRoots))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.newVoteOptionTreeRoots))
            )
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.newVoteWeightsPathElements))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.newVoteWeightsPathElements))
            )
            expect(circuitInputs.zerothStateLeafHash.toString()).toEqual(generatedInputs.zerothStateLeafHash.toString())
            expect(circuitInputs.zerothBallotHash.toString()).toEqual(generatedInputs.zerothBallotHash.toString())
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.zerothStateLeafPathElements))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.zerothStateLeafPathElements))
            )
            expect(
                JSON.stringify(stringifyBigInts(circuitInputs.zerothBallotPathElements))
            ).toEqual(
                JSON.stringify(stringifyBigInts(generatedInputs.zerothBallotPathElements))
            )
        })
    })
})
