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
} from 'maci-domainobjs'

const coordinator = new Keypair(new PrivKey(BigInt(config.maci.coordinatorPrivKey)))
const stateTreeDepth = config.maci.merkleTrees.stateTreeDepth
const messageTreeDepth = config.maci.merkleTrees.messageTreeDepth
const voteOptionTreeDepth = config.maci.merkleTrees.voteOptionTreeDepth
const initialVoiceCreditBalance = config.maci.initialVoiceCreditBalance
const maxVoteOptionIndex = config.maci.voteOptionsMaxLeafIndex

const user = new Keypair()

const maciState = new MaciState(
    coordinator,
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    maxVoteOptionIndex,
)

const genMessage = (command: Command): Message => {
    const signature = command.sign(user.privKey)
    const sharedKey = Keypair.genEcdhSharedKey(user.privKey, coordinator.pubKey)
    const message = command.encrypt(signature, sharedKey)

    return message
}

describe('Process one message', () => {
    beforeAll(async () => {
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
