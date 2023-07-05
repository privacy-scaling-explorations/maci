jest.setTimeout(1200000)
import { 
    genWitness,
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
    KCommand,
    Message,
    DeactivatedKeyLeaf,
} from 'maci-domainobjs'

import {
    hash2,
    hash5,
    IncrementalQuinTree,
    elGamalRerandomize,
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
    describe('1 user, 1 GenerateKeyFromDeactivated messages', () => {
        const maciState = new MaciState()
        let stateIndex
        let pollId
        let poll
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

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt]);

            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                voiceCreditBalance,
                nullifier,
                c1r,
                c2r,
                pollId,   
            )

            const { circuitInputs: inputs } = kCommand.prepareValues(
                userKeypair.privKey,
                maciState.stateLeaves,
                maciState.stateTree,
                BigInt(1),
                stateIndex,
                salt,
                coordinatorKeypair.pubKey,
                deactivatedKeys,
                BigInt(0),
                z,
                testC1,
                testC2,
            )

            const witness = await genWitness(circuit, inputs)
            expect(witness.length > 0).toBeTruthy()
        })

        it('should throw because random key passed to circuit instead of coordinators', async () => {
            
            const randomKeypair = new Keypair(new PrivKey(BigInt(999)));
            
            const salt = (new Keypair()).privKey.rawPrivKey

            const messageArr = [];
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

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

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt]);

            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                voiceCreditBalance,
                nullifier,
                c1r,
                c2r,
                pollId,   
            )

            const { circuitInputs: inputs } = kCommand.prepareValues(
                userKeypair.privKey,
                maciState.stateLeaves,
                maciState.stateTree,
                BigInt(1),
                stateIndex,
                salt,
                randomKeypair.pubKey,
                deactivatedKeys,
                BigInt(0),
                z,
                testC1,
                testC2,
            )

            await expect(genWitness(circuit, inputs)).rejects.toThrow();
        })

        it('should throw because the key that should be deactivated that is passed to circuit is not in the tree of deactivated keys', async () => {
            
            const keyPairNotInDeactivatedKeysTree = new Keypair(new PrivKey(BigInt(999)));
            
            const salt = (new Keypair()).privKey.rawPrivKey

            const messageArr = [];
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

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

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt]);

            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                voiceCreditBalance,
                nullifier,
                c1r,
                c2r,
                pollId,   
            )

            const { circuitInputs: inputs } = kCommand.prepareValues(
                keyPairNotInDeactivatedKeysTree.privKey,
                maciState.stateLeaves,
                maciState.stateTree,
                BigInt(1),
                stateIndex,
                salt,
                coordinatorKeypair.pubKey,
                deactivatedKeys,
                BigInt(0),
                z,
                testC1,
                testC2,
            )

            await expect(genWitness(circuit, inputs)).rejects.toThrow();
        })

        it('should throw because credit balance in the kCommand is bigger than the initial credit balance', async () => {
            
            const wrongCreditBalance = voiceCreditBalance + BigInt(1);

            const salt = (new Keypair()).privKey.rawPrivKey

            const messageArr = [];
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

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

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt]);

            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                wrongCreditBalance,
                nullifier,
                c1r,
                c2r,
                pollId,   
            )

            const { circuitInputs: inputs } = kCommand.prepareValues(
                userKeypair.privKey,
                maciState.stateLeaves,
                maciState.stateTree,
                BigInt(1),
                stateIndex,
                salt,
                coordinatorKeypair.pubKey,
                deactivatedKeys,
                BigInt(0),
                z,
                testC1,
                testC2,
            )

            await expect(genWitness(circuit, inputs)).rejects.toThrow();
        })
    })
})
