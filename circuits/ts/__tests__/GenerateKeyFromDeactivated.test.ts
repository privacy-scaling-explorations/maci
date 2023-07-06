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
    Keypair,
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
    describe('1 signup, 1 GenerateKeyFromDeactivated messages', () => {
        const maciState = new MaciState()
        let stateIndex
        let pollId
        let poll
        let numOfSignups = 0;
        const H0 = BigInt('8370432830353022751713833565135785980866757267633941821328460903436894336785');
        const userKeypair = new Keypair(new PrivKey(BigInt(1)));
        const newUserKeypair = new Keypair(new PrivKey(BigInt(7)));

        beforeAll(async () => {
            // Sign up and publish
            stateIndex = maciState.signUp(
                userKeypair.pubKey,
                voiceCreditBalance,
                // BigInt(1), 
                BigInt(Math.floor(Date.now() / 1000)),
            )

            numOfSignups++;

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
                BigInt(numOfSignups),
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
                BigInt(numOfSignups),
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
                BigInt(numOfSignups),
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

        it('should throw because the key that should be deactivated that is passed to circuit is not in the state tree', async () => {
            
            const keyPairNotInStateTree = new Keypair(new PrivKey(BigInt(999)));
            
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

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                keyPairNotInStateTree.pubKey,
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
                keyPairNotInStateTree.privKey,
                maciState.stateLeaves,
                maciState.stateTree,
                BigInt(numOfSignups),
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
                BigInt(numOfSignups),
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

        it('should throw because elgamalRerandomize output c1r, c2r passed to circuit is invalid', async () => {
            
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

            const wrongC1r = [BigInt(997), BigInt(994)];
            const wrongC2r = [BigInt(998), BigInt(993)];

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt]);

            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                voiceCreditBalance,
                nullifier,
                wrongC1r,
                wrongC2r,
                pollId,   
            )

            const { circuitInputs: inputs } = kCommand.prepareValues(
                userKeypair.privKey,
                maciState.stateLeaves,
                maciState.stateTree,
                BigInt(numOfSignups),
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

        it('should throw because nulifier hash passed to circuit as part of input hash is invalid', async () => {
            
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

            const wrongNullifier = BigInt(9999999999999);

            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                voiceCreditBalance,
                wrongNullifier,
                c1r,
                c2r,
                pollId,   
            )

            const { circuitInputs: inputs } = kCommand.prepareValues(
                userKeypair.privKey,
                maciState.stateLeaves,
                maciState.stateTree,
                BigInt(numOfSignups),
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

    describe('2 signups, 2 GenerateKeyFromDeactivated messages', () => {
        const maciState = new MaciState()
        let stateIndex
        let pollId
        let poll
        let numOfSignups = 0;
        const H0 = BigInt('8370432830353022751713833565135785980866757267633941821328460903436894336785');
        const userKeypair1 = new Keypair(new PrivKey(BigInt(1)));
        const newUserKeypair1 = new Keypair(new PrivKey(BigInt(7)));

        const userKeypair2 = new Keypair(new PrivKey(BigInt(8)));
        const newUserKeypair2 = new Keypair(new PrivKey(BigInt(12)));

        beforeAll(async () => {
            // Sign up and publish
            stateIndex = maciState.signUp(
                userKeypair1.pubKey,
                voiceCreditBalance,
                // BigInt(1), 
                BigInt(Math.floor(Date.now() / 1000)),
            )

            numOfSignups++;

            stateIndex = maciState.signUp(
                userKeypair2.pubKey,
                voiceCreditBalance,
                // BigInt(1), 
                BigInt(Math.floor(Date.now() / 1000)),
            )

            numOfSignups++;

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
                userKeypair1.pubKey,
                testC1,
                testC2,
                salt,
            )).hash())

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair2.pubKey,
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

            const nullifier1 = hash2([BigInt(userKeypair1.privKey.asCircuitInputs()), salt]);

            const kCommand1 = new KCommand(
                newUserKeypair1.pubKey,
                voiceCreditBalance,
                nullifier1,
                c1r,
                c2r,
                pollId,   
            )

            const { circuitInputs: inputs1 } = kCommand1.prepareValues(
                userKeypair1.privKey,
                maciState.stateLeaves,
                maciState.stateTree,
                BigInt(numOfSignups),
                stateIndex,
                salt,
                coordinatorKeypair.pubKey,
                deactivatedKeys,
                BigInt(0),
                z,
                testC1,
                testC2,
            )

            const witness1 = await genWitness(circuit, inputs1)
            expect(witness1.length > 0).toBeTruthy()

            const nullifier2 = hash2([BigInt(userKeypair2.privKey.asCircuitInputs()), salt]);

            const kCommand2 = new KCommand(
                newUserKeypair2.pubKey,
                voiceCreditBalance,
                nullifier2,
                c1r,
                c2r,
                pollId,   
            )

            const { circuitInputs: inputs2 } = kCommand2.prepareValues(
                userKeypair2.privKey,
                maciState.stateLeaves,
                maciState.stateTree,
                BigInt(numOfSignups),
                stateIndex,
                salt,
                coordinatorKeypair.pubKey,
                deactivatedKeys,
                BigInt(1),
                z,
                testC1,
                testC2,
            )

            const witness2 = await genWitness(circuit, inputs2)
            expect(witness2.length > 0).toBeTruthy()
        })
    })
})
