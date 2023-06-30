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
    DeactivatedKeyLeaf,
} from 'maci-domainobjs'

import {
    hash2,
    sha256Hash,
    hash5,
    IncrementalQuinTree,
    elGamalRerandomize,
    stringifyBigInts,
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
const circuit = 'generateKeyFromDeactivated_test'

describe('GenerateKeyFromDeactivated circuit', () => {
    describe('1 user, 0, 1 deactivation messages', () => {
        const maciState = new MaciState()
        const voteWeight = BigInt(0)
        const voteOptionIndex = BigInt(0)
        let stateIndex
        let pollId
        let poll
        const messages: Message[] = []
        const commands: PCommand[] = []
        const H0 = BigInt('8370432830353022751713833565135785980866757267633941821328460903436894336785');
        const userKeypair = new Keypair(new PrivKey(BigInt(1)));
        const newUserKeypair = new Keypair(new PrivKey(BigInt(2)));

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

        it('should accept proof based on deactivation messages', async () => {
            const salt = (new Keypair()).privKey.rawPrivKey

            const messageArr = [];
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // ecdhKeypair.pubKey -> encPubKey

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const testC1 = [BigInt(1), BigInt(1)];
            const testC2 = [BigInt(2), BigInt(2)];

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                testC1,
                testC2,
                salt,
            )).hash())

            const z = BigInt(42);
            const [c1r, c2r] = elGamalRerandomize(
                coordinatorKeypair.pubKey.rawPubKey,
                z,
                testC1,
                testC2,
            );
            const numSignUps = BigInt(1);

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt])

            const inputs = stringifyBigInts({
                oldPrivKey: userKeypair.privKey.asCircuitInputs(),         
                numSignUps,
                stateIndex,
                salt,
                stateTreeRoot: maciState.stateTree.root,
                deactivatedKeysRoot: deactivatedKeys.root,
                stateTreeInclusionProof: maciState.stateTree.genMerklePath(stateIndex).pathElements,
                oldCreditBalance: voiceCreditBalance,
                newCreditBalance: voiceCreditBalance,
                stateLeafTimestamp: maciState.stateLeaves[1].asCircuitInputs()[3],
                deactivatedKeysInclusionProof: deactivatedKeys.genMerklePath(0).pathElements,
                deactivatedKeyIndex: BigInt(0),
                c1: testC1,
                c2: testC2,
                coordinatorPubKey: coordinatorKeypair.pubKey.asCircuitInputs(),
                c1r,
                c2r,
                z,
                nullifier,
                inputHash: sha256Hash([
                    maciState.stateTree.root,
                    deactivatedKeys.root,
                    nullifier,
                    c1r[0],
                    c1r[1],
                    c2r[0],
                    c2r[1],
                ]),
            })

            const witness = await genWitness(circuit, inputs)
            expect(witness.length > 0).toBeTruthy()

            // const newMessageChainHash = await getSignalByName(circuit, witness, 'main.newMessageChainHash')
            // expect(newMessageChainHash).toEqual(H0.toString());
        })
    })
})
