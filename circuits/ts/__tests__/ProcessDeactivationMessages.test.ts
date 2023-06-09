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
} from 'maci-domainobjs'

import {
    hash2,
    hash5,
    IncrementalQuinTree,
    stringifyBigInts,
    NOTHING_UP_MY_SLEEVE,
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
        let H = H0;
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
             // Key deactivation command
             const command = new PCommand(
                stateIndex, //BigInt(1),
                new PubKey([BigInt(0), BigInt(0)]), // 0,0 PubKey
                voteOptionIndex, // 0,
                voteWeight, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
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
            commands.push(command)

            poll.publishMessage(message, ecdhKeypair.pubKey)
            
            // ecdhKeypair.pubKey -> encPubKey
            const messageHash = message.hash(ecdhKeypair.pubKey);

            console.log(maciState.stateLeaves);

            // const DEACT_TREE_ARITY = 5;

            // const deactivatedKeys = IncrementalQuinTree(
            //     STATE_TREE_DEPTH,
            //     H0,
            //     DEACT_TREE_ARITY,
            //     hash5,
            // )

            

            // deactivatedKeys.enqueue()
 
            // H = hash2([H, messageHash]);

            // const inputs = {

            // }

            return 0;
        })
    })
})
