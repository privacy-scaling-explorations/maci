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
    PrivKey,
    Keypair,
    Command,
    Message,
    VerifyingKey,
    Ballot,
} from 'maci-domainobjs'

import {
    hash5,
    G1Point,
    G2Point,
    IncrementalQuinTree,
    stringifyBigInts,
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
            // Sign up and publish
            const userKeypair = new Keypair(new PrivKey(BigInt(1)))
            stateIndex = maciState.signUp(
                userKeypair.pubKey,
                voiceCreditBalance,
                //BigInt(Math.floor(Date.now() / 1000)),
                BigInt(1),
            )

            maciState.stateAq.mergeSubRoots(0)
            maciState.stateAq.merge(STATE_TREE_DEPTH)

            pollId = maciState.deployPoll(
                duration,
                //BigInt(Math.floor(Date.now() / 1000) + duration),
                BigInt(2 + duration),
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
                //stateIndex,
                BigInt(1),
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

            //// Second command (valid)
            //const command2 = new Command(
                //stateIndex,
                //userKeypair.pubKey,
                //voteOptionIndex, // voteOptionIndex,
                //BigInt(1), // vote weight
                //BigInt(1), // nonce
                //BigInt(pollId),
            //)
            //const signature2 = command2.sign(userKeypair.privKey)

            //const ecdhKeypair2 = new Keypair()
            //const sharedKey2 = Keypair.genEcdhSharedKey(
                //ecdhKeypair2.privKey,
                //coordinatorKeypair.pubKey,
            //)
            //const message2 = command2.encrypt(signature2, sharedKey2)
            //messages.push(message2)
            //commands.push(command2)
            //messageTree.insert(message2.hash(ecdhKeypair2.pubKey))
            //poll.publishMessage(message2, ecdhKeypair2.pubKey)

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
            // The current roots
            const emptyBallot = new Ballot(
                poll.maxValues.maxVoteOptions,
                poll.treeDepths.voteOptionTreeDepth,
            )
            const emptyBallotHash = emptyBallot.hash()
            const ballotTree = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                emptyBallot.hash(),
                poll.STATE_TREE_ARITY,
                hash5,
            )

            for (let i = 0; i < poll.stateLeaves.length; i ++) {
                ballotTree.insert(emptyBallotHash)
            }
            const currentStateRoot = maciState.stateTree.root
            const currentBallotRoot = ballotTree.root

            const generatedInputs = poll.processMessages()

            // Calculate the witness
            const witness = await genWitness(circuit, generatedInputs)
            expect(witness.length > 0).toBeTruthy()

            //for (let i = 0; i < messageBatchSize; i ++) {
                //const debug = await getSignalByName(circuit, witness, `main.debug[${i}]`)
                //console.log(debug)
            //}

            //// The new roots, which should differ, since at least one of the
            //// messages modified a Ballot or State Leaf
            //const newStateRoot = poll.stateTree.root
            //const newBallotRoot = poll.ballotTree.root

            //expect(newStateRoot.toString()).not.toEqual(currentStateRoot.toString())
            //expect(newBallotRoot.toString()).not.toEqual(currentBallotRoot.toString())

            //fs.writeFileSync(
                //'input.json',
                //JSON.stringify(generatedInputs) 
            //)

            //fs.writeFileSync(
                //'witness.json',
                //JSON.stringify(witness) 
            //)

            //const packedVals = MaciState.packProcessMessageSmallVals(
                //maxValues.maxVoteOptions,
                //poll.numSignUps,
                //0,
                //poll.messageTree.leaves.length - 1,
            //)

            //// Test the ProcessMessagesInputHasher circuit
            //const hasherCircuit = 'processMessagesInputHasher_test'
            //const hasherCircuitInputs = stringifyBigInts({
                //packedVals,
                //coordPubKey: generatedInputs.coordPubKey,
                //msgRoot: generatedInputs.msgRoot,
                //currentSbCommitment: generatedInputs.currentSbCommitment,
                //newSbCommitment: generatedInputs.newSbCommitment,
                //pollEndTimestamp: generatedInputs.pollEndTimestamp,
            //})

            //const hasherWitness = await genWitness(hasherCircuit, hasherCircuitInputs)
            //const hash = await getSignalByName(hasherCircuit, hasherWitness, 'main.hash')
            //expect(hash.toString()).toEqual(generatedInputs.inputHash.toString())
        })
    })

    //const NUM_BATCHES = 2
    //describe(`1 user, ${messageBatchSize * NUM_BATCHES} messages`, () => {
        //it('should produce the correct state root and ballot root', async () => {
            //const maciState = new MaciState()
            //const userKeypair = new Keypair()
            //const stateIndex = maciState.signUp(
                //userKeypair.pubKey, 
                //voiceCreditBalance,
                //BigInt(Math.floor(Date.now() / 1000)),
            //)

            //maciState.stateAq.mergeSubRoots(0)
            //maciState.stateAq.merge(STATE_TREE_DEPTH)
            //// Sign up and publish
            //const pollId = maciState.deployPoll(
                //duration,
                //BigInt(Math.floor(Date.now() / 1000) + duration),
                //maxValues,
                //treeDepths,
                //messageBatchSize,
                //coordinatorKeypair,
                //testProcessVk,
                //testTallyVk,
            //)

            //const poll = maciState.polls[pollId]

            //const numMessages = messageBatchSize * NUM_BATCHES
            //for (let i = 0; i < numMessages; i ++) {
                //const command = new Command(
                    //stateIndex,
                    //userKeypair.pubKey,
                    //BigInt(i), //vote option index
                    //BigInt(1), // vote weight
                    //BigInt(numMessages - i), // nonce
                    //BigInt(pollId),
                //)

                //const signature = command.sign(userKeypair.privKey)

                //const ecdhKeypair = new Keypair()
                //const sharedKey = Keypair.genEcdhSharedKey(
                    //ecdhKeypair.privKey,
                    //coordinatorKeypair.pubKey,
                //)
                //const message = command.encrypt(signature, sharedKey)
                //poll.publishMessage(message, ecdhKeypair.pubKey)
            //}

            //poll.messageAq.mergeSubRoots(0)
            //poll.messageAq.merge(treeDepths.messageTreeDepth)

            //for (let i = 0; i < NUM_BATCHES; i ++) {
            ////for (let i = 0; i < 1; i ++) {
                //const generatedInputs = poll.processMessages()

                //const witness = await genWitness(circuit, generatedInputs)
                //expect(witness.length > 0).toBeTruthy()

            //}
        //})
    //})
})
