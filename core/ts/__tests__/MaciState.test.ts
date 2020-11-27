import { 
    User,
    Poll,
    MaciState,
} from '../'

import {
    Command,
    Message,
    Keypair,
    StateLeaf,
    VerifyingKey,
} from 'maci-domainobjs'
import { G1Point, G2Point } from 'maci-crypto'

const stateTreeDepth = 10
const voiceCreditBalance = BigInt(20)
const duration = 30
const maxValues = {
    maxUsers: 25,
    maxMessages: 25,
    maxVoteOptions: 25,
}

const treeDepths = {
    intStateTreeDepth: 1,
    messageTreeDepth: 3,
    messageTreeSubDepth: 2,
    voteOptionTreeDepth: 4,
}

const messageBatchSize = 25
const m1 = new MaciState()

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

const userKeypair = new Keypair()
const coordinatorKeypair = new Keypair()

describe('MaciState', () => {
    let pollId

    beforeAll(() => {
        m1.signUp(userKeypair.pubKey, voiceCreditBalance)
        pollId = m1.deployPoll(
            duration,
            maxValues,
            treeDepths,
            messageBatchSize,
            coordinatorKeypair,
            testProcessVk,
            testTallyVk,
        )
        const command = new Command(
            BigInt(0),
            userKeypair.pubKey,
            BigInt(0),
            BigInt(0),
            BigInt(0),
            BigInt(pollId),
            BigInt(0),
        )

        const encKeypair = new Keypair()
        const signature = command.sign(encKeypair.privKey)
        const sharedKey = Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorKeypair.pubKey)
        const message: Message = command.encrypt(signature, sharedKey)

        m1.polls[pollId].publishMessage(message, encKeypair.pubKey)
    })

    it('should correctly deep-copy a MaciState object', () => {
        const m2 = m1.copy()

        // modify stateTreeDepth
        m2.stateTreeDepth = m2.stateTreeDepth + 1
        expect(m1.equals(m2)).not.toBeTruthy()

        // modify user.pubKey
        const m3 = m1.copy()
        m3.users[0].pubKey = (new Keypair()).pubKey
        expect(m1.equals(m3)).not.toBeTruthy()

        // modify user.voiceCreditBalance
        const m4 = m1.copy()
        m4.users[0].voiceCreditBalance = BigInt(m4.users[0].voiceCreditBalance) + BigInt(1)
        expect(m1.equals(m4)).not.toBeTruthy()

        // modify poll.duration
        const m5 = m1.copy()
        m5.polls[pollId].duration = m5.polls[pollId].duration + 1
        expect(m1.equals(m5)).not.toBeTruthy()

        // modify poll.coordinatorKeypair
        const m6 = m1.copy()
        m6.polls[pollId].coordinatorKeypair = new Keypair()
        expect(m1.equals(m6)).not.toBeTruthy()

        // modify poll.processParamsFilename
        const m7 = m1.copy()
        m7.polls[pollId].processParamsFilename = 
            m7.polls[pollId].processParamsFilename + 'x'
        expect(m1.equals(m7)).not.toBeTruthy()
        
        // modify poll.tallyParamsFilename
        const m8 = m1.copy()
        m8.polls[pollId].tallyParamsFilename = 
            m8.polls[pollId].tallyParamsFilename + 'y'
        expect(m1.equals(m8)).not.toBeTruthy()

        // modify poll.treeDepths.intStateTreeDepth
        const m9 = m1.copy()
        m9.polls[pollId].treeDepths.intStateTreeDepth = m9.polls[pollId].treeDepths.intStateTreeDepth + 1
        expect(m1.equals(m9)).not.toBeTruthy()

        // modify poll.treeDepths.messageTreeDepth
        const m10 = m1.copy()
        m10.polls[pollId].treeDepths.messageTreeDepth = m10.polls[pollId].treeDepths.messageTreeDepth + 1
        expect(m1.equals(m10)).not.toBeTruthy()

        // modify poll.treeDepths.messageTreeSubDepth
        const m11 = m1.copy()
        m11.polls[pollId].treeDepths.messageTreeSubDepth = m11.polls[pollId].treeDepths.messageTreeSubDepth + 1
        expect(m1.equals(m11)).not.toBeTruthy()

        // modify poll.treeDepths.voteOptionTreeDepth
        const m12 = m1.copy()
        m12.polls[pollId].treeDepths.voteOptionTreeDepth = m12.polls[pollId].treeDepths.voteOptionTreeDepth + 1
        expect(m1.equals(m12)).not.toBeTruthy()

        // modify poll.batchSizes.tallyBatchSize
        const m13 = m1.copy()
        m13.polls[pollId].batchSizes.tallyBatchSize = m13.polls[pollId].batchSizes.tallyBatchSize + 1
        expect(m1.equals(m13)).not.toBeTruthy()

        // modify poll.batchSizes.messageBatchSize
        const m14 = m1.copy()
        m14.polls[pollId].batchSizes.messageBatchSize = m14.polls[pollId].batchSizes.messageBatchSize + 1
        expect(m1.equals(m14)).not.toBeTruthy()

        // modify poll.maxValues.maxUsers
        const m15 = m1.copy()
        m15.polls[pollId].maxValues.maxUsers = m15.polls[pollId].maxValues.maxUsers + 1
        expect(m1.equals(m15)).not.toBeTruthy()

        // modify poll.maxValues.maxMessages
        const m16 = m1.copy()
        m16.polls[pollId].maxValues.maxMessages = m16.polls[pollId].maxValues.maxMessages + 1
        expect(m1.equals(m16)).not.toBeTruthy()

        // modify poll.maxValues.maxVoteOptions
        const m17 = m1.copy()
        m17.polls[pollId].maxValues.maxVoteOptions = m17.polls[pollId].maxValues.maxVoteOptions + 1
        expect(m1.equals(m17)).not.toBeTruthy()

        // modify poll.processVk
        const m18 = m1.copy()
        m18.polls[pollId].processVk.ic[0].x =
            BigInt(m18.polls[pollId].processVk.ic[0].x) + BigInt(1)
        expect(m1.equals(m18)).not.toBeTruthy()

        // modify poll.tallyVk
        const m19 = m1.copy()
        m19.polls[pollId].tallyVk.ic[0].x =
            BigInt(m19.polls[pollId].tallyVk.ic[0].x) + BigInt(1)
        expect(m1.equals(m19)).not.toBeTruthy()

        // modify poll.messages
        const m20 = m1.copy()
        m20.polls[pollId].messages[0].iv = 
            BigInt(m20.polls[pollId].messages[0].iv) + BigInt(1)
        expect(m1.equals(m20)).not.toBeTruthy()

        // modify poll.encPubKeys
        const m21 = m1.copy()
        m21.polls[pollId].encPubKeys[0] = (new Keypair()).pubKey
        expect(m1.equals(m21)).not.toBeTruthy()
    })
})

