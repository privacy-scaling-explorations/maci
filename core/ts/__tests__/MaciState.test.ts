import { 
    User,
    MaciState,
} from '../'

import {
    Message,
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

const keypair = new Keypair()

const m1 = new MaciState(
    keypair,
    BigInt(4),
    BigInt(4),
    BigInt(4),
    BigInt(4),
)

describe('MaciState', () => {

    it('should correctly deep-copy a MaciState object', () => {
        const m2 = m1
        const m3 = m1.copy()

        // Modify coordinatorKeypair
        m1.coordinatorKeypair.privKey.rawPrivKey = BigInt(0)

        expect(m2.coordinatorKeypair.privKey.rawPrivKey)
            .toEqual(m1.coordinatorKeypair.privKey.rawPrivKey)

        expect(m3.coordinatorKeypair.privKey.rawPrivKey)
            .not.toEqual(m1.coordinatorKeypair.privKey.rawPrivKey)

        // Modify users
        m1.users.push(new User(
            keypair.pubKey,
            [],
            BigInt(0),
            BigInt(0),
        ))

        expect(m2.users.length).toEqual(m1.users.length)
        expect(m3.users.length).not.toEqual(m1.users.length)

        // Modify stateTreeDepth
        m1.stateTreeDepth = 5
        expect(m2.stateTreeDepth).toEqual(m1.stateTreeDepth)
        expect(m3.stateTreeDepth).not.toEqual(m1.stateTreeDepth)

        // Modify messageTreeDepth
        m1.messageTreeDepth = 5
        expect(m2.messageTreeDepth).toEqual(m1.messageTreeDepth)
        expect(m3.messageTreeDepth).not.toEqual(m1.messageTreeDepth)

        // Modify voteOptionTreeDepth
        m1.voteOptionTreeDepth = 5
        expect(m2.voteOptionTreeDepth).toEqual(m1.voteOptionTreeDepth)
        expect(m3.voteOptionTreeDepth).not.toEqual(m1.voteOptionTreeDepth)

        // Modify messages
        m1.messages.push(new Message(
            BigInt(0),
            [ 
                BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), 
                BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), 
            ],
        ))

        expect(m2.messages.length).toEqual(m1.messages.length)
        expect(m3.messages.length).not.toEqual(m1.messages.length)

        // Modify zerothStateLeaf
        m1.zerothStateLeaf = StateLeaf.genRandomLeaf()
        expect(m2.zerothStateLeaf.nonce).toEqual(m1.zerothStateLeaf.nonce)
        expect(m3.zerothStateLeaf.nonce).not.toEqual(m1.zerothStateLeaf.nonce)

        // Modify encPubKeys
        m1.encPubKeys.push(keypair.pubKey)
        expect(m2.encPubKeys.length).toEqual(m1.encPubKeys.length)
        expect(m3.encPubKeys.length).not.toEqual(m1.encPubKeys.length)

        // Modify maxVoteOptionIndex
        m1.maxVoteOptionIndex = BigInt(5)
        expect(m2.maxVoteOptionIndex).toEqual(m1.maxVoteOptionIndex)
        expect(m3.maxVoteOptionIndex).not.toEqual(m1.maxVoteOptionIndex)
    })
})
