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
    KCommand,
    Message,
    DeactivatedKeyLeaf,
} from 'maci-domainobjs'

import {
    hash2,
    encrypt,
    sha256Hash,
    hash5,
    IncrementalQuinTree,
    elGamalRerandomize,
    stringifyBigInts,
    elGamalEncryptBit,
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
const circuit = 'newKeyMessageToCommand_test'

describe('NewKeyMessageToCommand circuit', () => {
    describe('1 user, 1 deactivation messages', () => {
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
        const newUserKeypair = new Keypair(new PrivKey(BigInt(999)));

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

        it('should decrypt new key messages', async () => {
            const salt = (new Keypair()).privKey.rawPrivKey

            const messageArr = [];
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // ecdhKeypair.pubKey -> encPubKey
            const ecdhKeypair = new Keypair()
            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                coordinatorKeypair.pubKey,
            )

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
            const numSignUps = BigInt(1);

            const nullifier = hash2([BigInt(userKeypair.privKey.asCircuitInputs()), salt]);


            const kCommand = new KCommand(
                newUserKeypair.pubKey,
                voiceCreditBalance,
                nullifier,
                c1r,
                c2r,
                pollId,   
            )

            const { message, encPubKey } = kCommand.prepareValues(
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
                c1,
                c2,
            )

            // const encMessage = kCommand.encrypt(sharedKey);
            // console.log(kCommand);

            const inputs = stringifyBigInts({
                message: message.asCircuitInputs(),
                encPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                encPubKey: encPubKey.asCircuitInputs(),
            });

            const witness = await genWitness(circuit, inputs);
            expect(witness.length > 0).toBeTruthy();
            
            const decodedNewCreditBalance = await getSignalByName(circuit, witness, 'main.newCreditBalance');
            const decodedStatus = await getSignalByName(circuit, witness, 'main.isValidStatus');
            
            expect(BigInt(voiceCreditBalance)).toEqual(BigInt(decodedNewCreditBalance));
            expect(BigInt(decodedStatus)).toEqual(BigInt(1));
        })
    })
})
