jest.setTimeout(1200000)
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
    Keypair,
    KCommand,
    DeactivatedKeyLeaf,
} from 'maci-domainobjs'

import {
    hash2,
    hash5,
    IncrementalQuinTree,
    elGamalRerandomize,
    stringifyBigInts,
    elGamalEncryptBit,
} from 'maci-crypto'

const newCreditBalance = BigInt(100)

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
const circuit = 'newKeyMessageToCommand_test'

describe('NewKeyMessageToCommand circuit', () => {
    describe('1 signup, 1 deactivation messages', () => {
        const maciState = new MaciState()
        let stateIndex
        let pollId
        let poll
        let numOfSignups = 0;
        const H0 = BigInt('8370432830353022751713833565135785980866757267633941821328460903436894336785');
        const userKeypair = new Keypair(new PrivKey(BigInt(1)));
        const newUserKeypair = new Keypair(new PrivKey(BigInt(999)));

        beforeAll(async () => {
            // Sign up and publish
            stateIndex = maciState.signUp(
                userKeypair.pubKey,
                newCreditBalance,
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

        it('should decrypt new key messages if all input params are correct', async () => {
            const salt = (new Keypair()).privKey.rawPrivKey

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const [c1, c2] = elGamalEncryptBit(coordinatorKeypair.pubKey.rawPubKey, BigInt(1), BigInt(15));

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            const z = BigInt(42);
            const [c1r, c2r] = elGamalRerandomize(
                coordinatorKeypair.pubKey.rawPubKey,
                z,
                c1,
                c2,
            );

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt]);

            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                newCreditBalance,
                nullifier,
                c1r,
                c2r,
                pollId,   
            )

            const { message, encPubKey } = kCommand.prepareValues(
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
                c1,
                c2,
            )

            const inputs = stringifyBigInts({
                message: message.asCircuitInputs(),
                encPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                encPubKey: encPubKey.asCircuitInputs(),
            });

            const witness = await genWitness(circuit, inputs);
            expect(witness.length > 0).toBeTruthy();

            const decodednewPubKey0 = await getSignalByName(circuit, witness, 'main.newPubKey[0]');
            const decodednewPubKey1 = await getSignalByName(circuit, witness, 'main.newPubKey[1]');            
            const decodedNewCreditBalance = await getSignalByName(circuit, witness, 'main.newCreditBalance');
            const decodedNulifier = await getSignalByName(circuit, witness, 'main.nullifier');
            const decodedPollId = await getSignalByName(circuit, witness, 'main.pollId');
            const decodedC1r0 = await getSignalByName(circuit, witness, 'main.c1r[0]');
            const decodedC1r1 = await getSignalByName(circuit, witness, 'main.c1r[1]');
            const decodedC2r0 = await getSignalByName(circuit, witness, 'main.c2r[0]');
            const decodedC2r1 = await getSignalByName(circuit, witness, 'main.c2r[1]');
            const decodedStatus = await getSignalByName(circuit, witness, 'main.isValidStatus');

            expect(newUserKeypair.pubKey.rawPubKey[0]).toEqual(BigInt(decodednewPubKey0));
            expect(newUserKeypair.pubKey.rawPubKey[1]).toEqual(BigInt(decodednewPubKey1));
            expect(BigInt(newCreditBalance)).toEqual(BigInt(decodedNewCreditBalance));
            expect(nullifier).toEqual(BigInt(decodedNulifier));
            expect(BigInt(pollId)).toEqual(BigInt(decodedPollId));
            expect(c1r[0]).toEqual(BigInt(decodedC1r0));
            expect(c1r[1]).toEqual(BigInt(decodedC1r1));
            expect(c2r[0]).toEqual(BigInt(decodedC2r0));
            expect(c2r[1]).toEqual(BigInt(decodedC2r1));
            expect(BigInt(decodedStatus)).toEqual(BigInt(1));
        })

        it('should return isValidStatus != 1 because random private key passed to circuit instead of coordinators', async () => {
            const randomKeypair = new Keypair(new PrivKey(BigInt(999)));

            const salt = (new Keypair()).privKey.rawPrivKey

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const [c1, c2] = elGamalEncryptBit(coordinatorKeypair.pubKey.rawPubKey, BigInt(1), BigInt(15));

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            const z = BigInt(42);
            const [c1r, c2r] = elGamalRerandomize(
                coordinatorKeypair.pubKey.rawPubKey,
                z,
                c1,
                c2,
            );

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt]);

            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                newCreditBalance,
                nullifier,
                c1r,
                c2r,
                pollId,   
            )

            const { message, encPubKey } = kCommand.prepareValues(
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
                c1,
                c2,
            )

            const inputs = stringifyBigInts({
                message: message.asCircuitInputs(),
                encPrivKey: randomKeypair.privKey.asCircuitInputs(),
                encPubKey: encPubKey.asCircuitInputs(),
            });

            const witness = await genWitness(circuit, inputs);
            expect(witness.length > 0).toBeTruthy();

            const decodedStatus = await getSignalByName(circuit, witness, 'main.isValidStatus');

            expect(BigInt(decodedStatus)).not.toEqual(BigInt(1));
        })

        it('should return isValidStatus != 1 because random public key passed to circuit instead of shared one', async () => {
            const randomKeypair = new Keypair(new PrivKey(BigInt(999)));
            const salt = (new Keypair()).privKey.rawPrivKey

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const [c1, c2] = elGamalEncryptBit(coordinatorKeypair.pubKey.rawPubKey, BigInt(1), BigInt(15));

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            const z = BigInt(42);
            const [c1r, c2r] = elGamalRerandomize(
                coordinatorKeypair.pubKey.rawPubKey,
                z,
                c1,
                c2,
            );

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt]);

            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                newCreditBalance,
                nullifier,
                c1r,
                c2r,
                pollId,   
            )

            const { message, encPubKey } = kCommand.prepareValues(
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
                c1,
                c2,
            )

            const inputs = stringifyBigInts({
                message: message.asCircuitInputs(),
                encPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                encPubKey: randomKeypair.pubKey.asCircuitInputs(),
            });

            const witness = await genWitness(circuit, inputs);
            expect(witness.length > 0).toBeTruthy();

            const decodedStatus = await getSignalByName(circuit, witness, 'main.isValidStatus');

            expect(BigInt(decodedStatus)).not.toEqual(BigInt(1));
        })

        it('should return isValidStatus != 1 because malformed message passed to circuit', async () => {
            const salt = (new Keypair()).privKey.rawPrivKey

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const [c1, c2] = elGamalEncryptBit(coordinatorKeypair.pubKey.rawPubKey, BigInt(1), BigInt(15));

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            const z = BigInt(42);
            const [c1r, c2r] = elGamalRerandomize(
                coordinatorKeypair.pubKey.rawPubKey,
                z,
                c1,
                c2,
            );

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt]);

            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                newCreditBalance,
                nullifier,
                c1r,
                c2r,
                pollId,   
            )

            const { message, encPubKey } = kCommand.prepareValues(
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
                c1,
                c2,
            )

            const malformedMessageAsCircuitInputs = [
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0)
            ]

            const inputs = stringifyBigInts({
                message: malformedMessageAsCircuitInputs,
                encPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                encPubKey: encPubKey.asCircuitInputs(),
            });

            const witness = await genWitness(circuit, inputs);
            expect(witness.length > 0).toBeTruthy();

            const decodedStatus = await getSignalByName(circuit, witness, 'main.isValidStatus');
            expect(BigInt(decodedStatus)).not.toEqual(BigInt(1));
        })
    })
})
