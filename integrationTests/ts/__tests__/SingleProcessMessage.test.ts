import { MaciState } from 'maci-core'
import { config } from 'maci-config'
import {
    bigInt,
    genRandomSalt,
    genEcdhSharedKey,
    NOTHING_UP_MY_SLEEVE,
} from 'maci-crypto'
import {
    PrivKey,
    Command,
    Keypair,
} from 'maci-domainobjs'

const coordinator = new Keypair(new PrivKey(bigInt(config.maci.coordinatorPrivKey)))
const stateTreeDepth = config.maci.merkleTrees.stateTreeDepth
const messageTreeDepth = config.maci.merkleTrees.messageTreeDepth
const voteOptionTreeDepth = config.maci.merkleTrees.voteOptionTreeDepth
const initialVoiceCreditBalance = config.maci.initialVoiceCreditBalance

const user = new Keypair()

const maciState = new MaciState(
    coordinator,
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    NOTHING_UP_MY_SLEEVE,
)

const stateIndex = bigInt(1)
const voteOptionIndex = bigInt(0)
const newVoteWeight = bigInt(9)
const nonce = bigInt(0)
const salt = genRandomSalt()

const command = new Command(
    stateIndex,
    user.pubKey, voteOptionIndex,
    newVoteWeight,
    nonce,
    salt,
)
const signature = command.sign(user.privKey)
const sharedKey = genEcdhSharedKey(user.privKey, coordinator.pubKey)
const message = command.encrypt(signature, sharedKey)

describe('Process one message', () => {
    beforeAll(async () => {
        // Sign up the user
        maciState.signUp(user.pubKey, initialVoiceCreditBalance)

        // Publish a message
        maciState.publishMessage(message, user.pubKey)
    })

    it('the state change that processMessage() effects should be valid', async () => {
    })
})
