import { MaciState } from '../'
import { config } from 'maci-config'
import {
    genRandomSalt,
} from 'maci-crypto'
import {
    PrivKey,
    Command,
    Message,
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

const coordinator = new Keypair(new PrivKey(BigInt(config.maci.coordinatorPrivKey)))
const stateTreeDepth = config.maci.merkleTrees.stateTreeDepth
const messageTreeDepth = config.maci.merkleTrees.messageTreeDepth
const voteOptionTreeDepth = config.maci.merkleTrees.voteOptionTreeDepth
const initialVoiceCreditBalance = config.maci.initialVoiceCreditBalance
const maxVoteOptionIndex = config.maci.voteOptionsMaxLeafIndex

const user = new Keypair()
const batchSize = 4

const genMessage = (command: Command): Message => {
    const signature = command.sign(user.privKey)
    const sharedKey = Keypair.genEcdhSharedKey(user.privKey, coordinator.pubKey)
    const message = command.encrypt(signature, sharedKey)

    return message
}

describe('Message processing', () => {

    describe('Process a batch of messages', () => {
        let maciState
        beforeAll(async () => {
            maciState = new MaciState(
                coordinator,
                stateTreeDepth,
                messageTreeDepth,
                voteOptionTreeDepth,
                maxVoteOptionIndex,
            )
            // Sign up the user
            maciState.signUp(user.pubKey, initialVoiceCreditBalance)
        })

        it('batchProcessMessage() should process a batch of messages', async () => {

            const oldState = maciState.copy()

            const messages: Message[] = []
            for (let i = 0; i < batchSize; i ++) {
                const voteWeight = BigInt(i + 1)
                const command = new Command(
                    BigInt(1),
                    user.pubKey,
                    BigInt(0),
                    voteWeight,
                    BigInt(i + 1),
                    genRandomSalt(),
                )
                const signature = command.sign(user.privKey)
                const sharedKey = Keypair.genEcdhSharedKey(user.privKey, coordinator.pubKey)
                const message = command.encrypt(signature, sharedKey)
                messages.push(message)
            }
            // nonce:voteWeight in messages [ m0: 1, m1: 2, m2: 3, m3: 4 ]
            // in regular order, only m3 is valid
            // if processed in reverse order, only m0 is valid

            for (const message of messages) {
                maciState.publishMessage(message, user.pubKey)
            }

            expect(maciState.messages.length).toEqual(batchSize)

            const randomStateLeaf = StateLeaf.genRandomLeaf()
            maciState.batchProcessMessage(0, batchSize, randomStateLeaf)
            const newStateRoot = maciState.genStateRoot()

            expect(newStateRoot.toString()).not.toEqual(oldState.genStateRoot().toString())
            expect(maciState.users[0].voiceCreditBalance.toString())
                .toEqual((initialVoiceCreditBalance - 1).toString())
        })
    })

    describe('Process one message', () => {
        let maciState

        beforeAll(async () => {
            maciState = new MaciState(
                coordinator,
                stateTreeDepth,
                messageTreeDepth,
                voteOptionTreeDepth,
                maxVoteOptionIndex,
            )
            // Sign up the user
            maciState.signUp(user.pubKey, initialVoiceCreditBalance)
        })

        it('processMessage() should process a valid message', async () => {
            const voteWeight = BigInt(9)
            const command = new Command(
                BigInt(1),
                user.pubKey,
                BigInt(0),
                voteWeight,
                BigInt(1),
                genRandomSalt(),
            )

            const message = genMessage(command)

            const copiedState = maciState.copy()

            // Publish a message
            copiedState.publishMessage(message, user.pubKey)
            expect(copiedState.messages.length).toEqual(1)
            const oldState = copiedState.copy()
            copiedState.processMessage(0)
            const newStateRoot = copiedState.genStateRoot()

            expect(newStateRoot.toString()).not.toEqual(oldState.genStateRoot().toString())
            expect(copiedState.users[0].voiceCreditBalance.toString())
                .toEqual((BigInt(initialVoiceCreditBalance) - (voteWeight * voteWeight)).toString())
        })

        it('processMessage() should not process a message with an incorrect nonce', async () => {
            const command = new Command(
                BigInt(1),
                user.pubKey,
                BigInt(0),
                BigInt(9),
                BigInt(0),
                genRandomSalt(),
            )

            const message = genMessage(command)

            const copiedState = maciState.copy()

            // Publish a message
            copiedState.publishMessage(message, user.pubKey)
            expect(copiedState.messages.length).toEqual(1)
            const oldState = copiedState.copy()
            copiedState.processMessage(0)
            const newStateRoot = copiedState.genStateRoot()

            expect(newStateRoot.toString()).toEqual(oldState.genStateRoot().toString())
        })

        it('processMessage() should not process a message with an incorrect vote weight', async () => {
            const command = new Command(
                BigInt(1),
                user.pubKey,
                BigInt(0),
                BigInt(initialVoiceCreditBalance + 1),
                BigInt(1),
                genRandomSalt(),
            )

            const message = genMessage(command)

            const copiedState = maciState.copy()

            // Publish a message
            copiedState.publishMessage(message, user.pubKey)
            expect(copiedState.messages.length).toEqual(1)
            const oldState = copiedState.copy()
            copiedState.processMessage(0)
            const newStateRoot = copiedState.genStateRoot()

            expect(newStateRoot.toString()).toEqual(oldState.genStateRoot().toString())
        })

        it('processMessage() should not process a message with an incorrect state tree index', async () => {
            const command = new Command(
                BigInt(2),
                user.pubKey,
                BigInt(0),
                BigInt(9),
                BigInt(1),
                genRandomSalt(),
            )

            const message = genMessage(command)

            const copiedState = maciState.copy()

            // Publish a message
            copiedState.publishMessage(message, user.pubKey)
            expect(copiedState.messages.length).toEqual(1)
            const oldState = copiedState.copy()
            copiedState.processMessage(0)
            const newStateRoot = copiedState.genStateRoot()

            expect(newStateRoot.toString()).toEqual(oldState.genStateRoot().toString())
        })

        it('processMessage() should not process a message with an incorrect signature', async () => {
            const command = new Command(
                BigInt(1),
                user.pubKey,
                BigInt(0),
                BigInt(9),
                BigInt(1),
                genRandomSalt(),
            )

            const signature = command.sign(user.privKey)
            signature.S = BigInt(signature.S) + BigInt(1)
            const sharedKey = Keypair.genEcdhSharedKey(user.privKey, coordinator.pubKey)
            const message = command.encrypt(signature, sharedKey)

            const copiedState = maciState.copy()

            // Publish a message
            copiedState.publishMessage(message, user.pubKey)
            expect(copiedState.messages.length).toEqual(1)
            const oldState = copiedState.copy()
            copiedState.processMessage(0)
            const newStateRoot = copiedState.genStateRoot()

            expect(newStateRoot.toString()).toEqual(oldState.genStateRoot().toString())
        })

        it('processMessage() should not process a message with an invalid maxVoteOptionIndex', async () => {
            const command = new Command(
                BigInt(1),
                user.pubKey,
                BigInt(maxVoteOptionIndex + 1),
                BigInt(9),
                BigInt(1),
                genRandomSalt(),
            )

            const signature = command.sign(user.privKey)
            const sharedKey = Keypair.genEcdhSharedKey(user.privKey, coordinator.pubKey)
            const message = command.encrypt(signature, sharedKey)

            const copiedState = maciState.copy()

            // Publish a message
            copiedState.publishMessage(message, user.pubKey)
            expect(copiedState.messages.length).toEqual(1)
            const oldState = copiedState.copy()
            copiedState.processMessage(0)
            const newStateRoot = copiedState.genStateRoot()

            expect(newStateRoot.toString()).toEqual(oldState.genStateRoot().toString())
        })
    })
})
