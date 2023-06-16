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
    PubKey,
    Keypair,
    PCommand,
    Message,
    Ballot,
    StateLeaf,
    DeactivatedKeyLeaf,
} from 'maci-domainobjs'

import {
    hash2,
    hash5,
    IncrementalQuinTree,
    elGamalEncryptBit,
    stringifyBigInts,
    NOTHING_UP_MY_SLEEVE,
} from 'maci-crypto'

const voiceCreditBalance = BigInt(100)

const duration = 30
const maxValues = {
    maxUsers: 25,
    maxMessages: 3,
    maxVoteOptions: 25,
}

const treeDepths = {
    intStateTreeDepth: 2,
    messageTreeDepth: 2,
    messageTreeSubDepth: 1,
    voteOptionTreeDepth: 2,
}

const messageBatchSize = 5

const coordinatorKeypair = new Keypair()
const circuit = 'processDeactivationMessages_test'

describe('ProcessDeactivationMessages circuit', () => {
    describe('1 user, 2 messages', () => {
        const maciState = new MaciState()
        const voteWeight = BigInt(0)
        const voteOptionIndex = BigInt(0)
        let stateIndex
        let pollId
        let poll
        const messages: Message[] = []
        const commands: PCommand[] = []
        const H0 = BigInt('8370432830353022751713833565135785980866757267633941821328460903436894336785');
        let H;
        const userKeypair = new Keypair(new PrivKey(BigInt(1)));

        beforeAll(async () => {
            // Sign up and publish
            stateIndex = maciState.signUp(
                userKeypair.pubKey,
                voiceCreditBalance,
                // BigInt(1), 
                BigInt(Math.floor(Date.now() / 1000)),
            )

            // Merge state tree
            maciState.stateAq.mergeSubRoots(0)
            maciState.stateAq.merge(STATE_TREE_DEPTH)

            // Deploy new poll
            pollId = maciState.deployPoll(
                duration,
                // BigInt(2 + duration), 
                BigInt(Math.floor(Date.now() / 1000) + duration),
                maxValues,
                treeDepths,
                messageBatchSize,
                coordinatorKeypair,
            )

            poll = maciState.polls[pollId]
        })

        it('should process deactivation message', async () => {
            const salt = (new Keypair()).privKey.rawPrivKey

             // Key deactivation command
             const command = new PCommand(
                stateIndex, //BigInt(1),
                new PubKey([BigInt(0), BigInt(0)]), // 0,0 PubKey
                voteOptionIndex, // 0,
                voteWeight, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
                salt,
            )

            const signature = command.sign(userKeypair.privKey)

            const ecdhKeypair = new Keypair()
            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                coordinatorKeypair.pubKey,
            )

            // Encrypt command and publish
            const message = command.encrypt(signature, sharedKey)
            messages.push(message)
            // commands.push(command)

            // poll.publishMessage(message, ecdhKeypair.pubKey)
            // poll.messageAq.mergeSubRoots(0)
            // poll.messageAq.merge(treeDepths.messageTreeDepth)


            const messageArr = [message];
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // console.log(maciState.stateLeaves)

            // ecdhKeypair.pubKey -> encPubKey
            const messageHash = message.hash(ecdhKeypair.pubKey);

            // console.log(maciState.stateLeaves);

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const mask = BigInt(Math.ceil(Math.random() * 1000))
            const maskingValues = [mask.toString()]

            const status = BigInt(1);
            const [c1, c2] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask
            )

            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())

            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }

            // Insert empty node
            // deactivatedKeys.insert( (new DeactivatedKeyLeaf(
            //     new PubKey([BigInt(0), BigInt(0)]),
            //     [BigInt(0), BigInt(0)],
            //     [BigInt(0), BigInt(0)],
            //     BigInt(0),
            // )).hash())

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())
            // console.log(messageHash)
            H = hash2([H0, messageHash])

            // console.log(ecdhKeypair.pubKey);
            // console.log(message.asCircuitInputs());
            // console.log(messages);

            const encPubKeys = [ecdhKeypair.pubKey.asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }

            console.log(encPubKeys)

            const deactivatedTreePathElements = [deactivatedKeys.genMerklePath(0).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(0).pathElements)
            }
            
            const stateLeafPathElements = [maciState.stateTree.genMerklePath(stateIndex).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }

            const currentStateLeaves = [maciState.stateLeaves[1].asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }

            const elGamalEnc = [[c1, c2]]
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    coordinatorKeypair.pubKey.rawPubKey, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }

            // console.log(stateLeafPathElements[0])

            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: 1,
            })

            // console.log([[c1, c2]])
            // console.log(inputs)

            

            // console.log(inputs);
            const witness = await genWitness(circuit, inputs)
            expect(witness.length > 0).toBeTruthy()

            const newMessageChainHash = await getSignalByName(circuit, witness, 'main.newMessageChainHash')

            console.log(H, newMessageChainHash)
            return 0;
        })
    })
})
