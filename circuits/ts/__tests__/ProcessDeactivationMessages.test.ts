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
    hash5,
    IncrementalQuinTree,
    elGamalEncryptBit,
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
const circuit = 'processDeactivationMessages_test'

describe('ProcessDeactivationMessages circuit', () => {
    describe('1 user, 0, 1 or 2 deactivation messages', () => {
        const maciState = new MaciState()
        const voteWeight = BigInt(0)
        const voteOptionIndex = BigInt(0)
        let stateIndex
        let pollId
        let poll
        const messages: Message[] = []
        const commands: PCommand[] = []
        const H0 = BigInt('8370432830353022751713833565135785980866757267633941821328460903436894336785');
        let H;
        let H2;
        const userKeypair = new Keypair(new PrivKey(BigInt(1)));

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

        it('should return empty array hash in case no deactivation messages', async () => {
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

            
            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())
            
            const maskingValues = []
            // Pad array
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }

            H = H0;

            const encPubKeys = [];
            // Pad array
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }

            const deactivatedTreePathElements = [];
            // Pad array
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(0).pathElements)
            }
            
            const stateLeafPathElements = [];
            // Pad array
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }

            const currentStateLeaves = [];
            // Pad array
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }

            const elGamalEnc = []
            // Pad array
            for (let i = 0; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    coordinatorKeypair.pubKey.rawPubKey, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }

            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: 1,
            })

            const witness = await genWitness(circuit, inputs)
            expect(witness.length > 0).toBeTruthy()

            const newMessageChainHash = await getSignalByName(circuit, witness, 'main.newMessageChainHash')
            expect(newMessageChainHash).toEqual(H0.toString());
        })

        it('should process exactly 1 deactivation message', async () => {
            const salt = (new Keypair()).privKey.rawPrivKey

            // Key deactivation command
            const command = new PCommand(
                stateIndex, //BigInt(1),
                new PubKey([BigInt(0), BigInt(0)]), // 0,0 PubKey
                voteOptionIndex, // 0,
                voteWeight, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
                salt,
            )

            const signature = command.sign(userKeypair.privKey)

            const ecdhKeypair = new Keypair()
            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                coordinatorKeypair.pubKey,
            )

            // Encrypt command and publish
            const message = command.encrypt(signature, sharedKey)
            messages.push(message)

            const messageArr = [message];
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // ecdhKeypair.pubKey -> encPubKey
            const messageHash = message.hash(ecdhKeypair.pubKey);

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const mask = BigInt(Math.ceil(Math.random() * 1000))
            const maskingValues = [mask.toString()]

            const status = BigInt(1);
            const [c1, c2] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask
            )

            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())

            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            H = hash2([H0, messageHash])

            const encPubKeys = [ecdhKeypair.pubKey.asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }

            const deactivatedTreePathElements = [deactivatedKeys.genMerklePath(0).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(0).pathElements)
            }
            
            const stateLeafPathElements = [maciState.stateTree.genMerklePath(stateIndex).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }

            const currentStateLeaves = [maciState.stateLeaves[1].asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }

            const elGamalEnc = [[c1, c2]]
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    coordinatorKeypair.pubKey.rawPubKey, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }

            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: 1,
            })

            const witness = await genWitness(circuit, inputs)
            expect(witness.length > 0).toBeTruthy()

            const newMessageChainHash = await getSignalByName(circuit, witness, 'main.newMessageChainHash')
            expect(newMessageChainHash).toEqual(H.toString());
        })

        it('should process exactly 2 deactivation messages', async () => {
            const salt1 = (new Keypair()).privKey.rawPrivKey;
            const salt2 = (new Keypair()).privKey.rawPrivKey;
        
            // Key deactivation commands
            const command1 = new PCommand(
                stateIndex, //BigInt(1),
                new PubKey([BigInt(0), BigInt(0)]), // 0,0 PubKey
                voteOptionIndex, // 0,
                voteWeight, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
                salt1,
            );
        
            const command2 = new PCommand(
                stateIndex, //BigInt(1),
                new PubKey([BigInt(0), BigInt(0)]), // 0,0 PubKey
                voteOptionIndex, // 0,
                voteWeight, // vote weight
                BigInt(3), // nonce
                BigInt(pollId),
                salt2,
            );
        
            const signature1 = command1.sign(userKeypair.privKey);
            const signature2 = command2.sign(userKeypair.privKey);
        
            const ecdhKeypair = new Keypair()
            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                coordinatorKeypair.pubKey,
            )
        
            // Encrypt commands and publish
            const message1 = command1.encrypt(signature1, sharedKey)
            const message2 = command2.encrypt(signature2, sharedKey)
            messages.push(message1);
            messages.push(message2);
        
            const messageArr = [message1, message2];
            for (let i = 2; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }
        
            // ecdhKeypair.pubKey -> encPubKey
            const messageHash1 = message1.hash(ecdhKeypair.pubKey);
            const messageHash2 = message2.hash(ecdhKeypair.pubKey);
        
            const DEACT_TREE_ARITY = 5;
        
            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )
        
            const mask1 = BigInt(Math.ceil(Math.random() * 1000))
            const mask2 = BigInt(Math.ceil(Math.random() * 1000))
        
            const maskingValues = [mask1.toString(), mask2.toString()]
        
            const status = BigInt(1);
        
            const [c11, c12] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask1
            )
        
            const [c21, c22] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask2
            )
        
            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())
        
            for (let i = 2; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }
        
            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c11,
                c12,
                salt1,
            )).hash())
        
            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c21,
                c22,
                salt2,
            )).hash())
        
            H = hash2([H0, messageHash1])
            H2 = hash2([H, messageHash2])
        
            const encPubKeys = [ecdhKeypair.pubKey.asCircuitInputs(), ecdhKeypair.pubKey.asCircuitInputs()];
            
            // Pad array
            for (let i = 2; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }
    
        
            const deactivatedTreePathElements = [
                deactivatedKeys.genMerklePath(0).pathElements,
                deactivatedKeys.genMerklePath(1).pathElements
            ];
    
            // Pad array
            for (let i = 2; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(0).pathElements)
            }
            
            const stateLeafPathElements = [maciState.stateTree.genMerklePath(stateIndex).pathElements, maciState.stateTree.genMerklePath(stateIndex).pathElements];
            
            // Pad array
            for (let i = 2; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }
        
            const currentStateLeaves = [
                maciState.stateLeaves[1].asCircuitInputs(),
                maciState.stateLeaves[1].asCircuitInputs()
            ];
            // Pad array
            for (let i = 2; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }
        
            const elGamalEnc = [[c11, c12], [c21, c22]]
            // Pad array
            for (let i = 2; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    coordinatorKeypair.pubKey.rawPubKey, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }
        
            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: 1,
            })
        
            const witness = await genWitness(circuit, inputs)
            expect(witness.length > 0).toBeTruthy()
        
            const newMessageChainHash = await getSignalByName(circuit, witness, 'main.newMessageChainHash')
            expect(newMessageChainHash).toEqual(H2.toString());
        })
    })

    describe('1 user, wrong circuit inputs', () => {
        const maciState = new MaciState()
        const voteWeight = BigInt(0)
        const voteOptionIndex = BigInt(0)
        let stateIndex
        let pollId
        let poll
        const messages: Message[] = []
        const commands: PCommand[] = []
        const H0 = BigInt('8370432830353022751713833565135785980866757267633941821328460903436894336785');
        let H;
        let H2;
        const userKeypair = new Keypair(new PrivKey(BigInt(1)));

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
        
        it('should throw if numSignUps 0 instead of 1 with 1 deactivation message', async () => {
            const NUM_OF_SIGNUPS = 0; // Wrong number, should be 1
            const VOTE_WEIGHT = voteWeight;
            const MESSAGE_PUB_KEY = new PubKey([BigInt(0), BigInt(0)]);
            const KEY_FOR_COORD_PART_OF_SHARED_KEY = coordinatorKeypair.pubKey;
            const DEACTIVATED_KEYS_TREE_ELEMENT_INDEX = 0;
            const STATE_TREE_ELEMENT_INDEX = stateIndex;
            const KEY_FOR_ELGAMAL_ENCRYPTION = coordinatorKeypair.pubKey.rawPubKey;

            const salt = (new Keypair()).privKey.rawPrivKey

            // Key deactivation command
            const command = new PCommand(
                stateIndex, //BigInt(1),
                MESSAGE_PUB_KEY,
                voteOptionIndex, // 0,
                VOTE_WEIGHT, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
                salt,
            )

            const signature = command.sign(userKeypair.privKey)

            const ecdhKeypair = new Keypair()
            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                KEY_FOR_COORD_PART_OF_SHARED_KEY,
            )

            // Encrypt command and publish
            const message = command.encrypt(signature, sharedKey)
            messages.push(message)

            const messageArr = [message];
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // ecdhKeypair.pubKey -> encPubKey
            const messageHash = message.hash(ecdhKeypair.pubKey);

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const mask = BigInt(Math.ceil(Math.random() * 1000))
            const maskingValues = [mask.toString()]

            const status = BigInt(1);
            const [c1, c2] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask
            )

            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())

            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            H = hash2([H0, messageHash])

            const encPubKeys = [ecdhKeypair.pubKey.asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }

            console.log(encPubKeys)

            const deactivatedTreePathElements = [deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements)
            }
            
            const stateLeafPathElements = [maciState.stateTree.genMerklePath(STATE_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }

            const currentStateLeaves = [maciState.stateLeaves[1].asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }

            const elGamalEnc = [[c1, c2]]
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    KEY_FOR_ELGAMAL_ENCRYPTION, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }

            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: NUM_OF_SIGNUPS,
            })

            await expect(genWitness(circuit, inputs)).rejects.toThrow();
        })

        it('should throw if public key part of shared key is not coordinators', async () => {
            const NUM_OF_SIGNUPS = 1;
            const VOTE_WEIGHT = voteWeight;
            const MESSAGE_PUB_KEY = new PubKey([BigInt(0), BigInt(0)]);
            const ecdhKeypair = new Keypair()
            const KEY_FOR_COORD_PART_OF_SHARED_KEY = ecdhKeypair.pubKey; // Wrong pub key, should be coordinators
            const DEACTIVATED_KEYS_TREE_ELEMENT_INDEX = 0;
            const STATE_TREE_ELEMENT_INDEX = stateIndex;
            const KEY_FOR_ELGAMAL_ENCRYPTION = coordinatorKeypair.pubKey.rawPubKey;

            const salt = (new Keypair()).privKey.rawPrivKey

            // Key deactivation command
            const command = new PCommand(
                stateIndex, //BigInt(1),
                MESSAGE_PUB_KEY, // 0,0 PubKey
                voteOptionIndex, // 0,
                VOTE_WEIGHT, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
                salt,
            )

            const signature = command.sign(userKeypair.privKey)

            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                KEY_FOR_COORD_PART_OF_SHARED_KEY
            )

            // Encrypt command and publish
            const message = command.encrypt(signature, sharedKey)
            messages.push(message)

            const messageArr = [message];
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // ecdhKeypair.pubKey -> encPubKey
            const messageHash = message.hash(ecdhKeypair.pubKey);

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const mask = BigInt(Math.ceil(Math.random() * 1000))
            const maskingValues = [mask.toString()]

            const status = BigInt(1);
            const [c1, c2] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask
            )

            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())

            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            H = hash2([H0, messageHash])

            const encPubKeys = [ecdhKeypair.pubKey.asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }

            console.log(encPubKeys)

            const deactivatedTreePathElements = [deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements)
            }
            
            const stateLeafPathElements = [maciState.stateTree.genMerklePath(STATE_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }

            const currentStateLeaves = [maciState.stateLeaves[1].asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }

            const elGamalEnc = [[c1, c2]]
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    KEY_FOR_ELGAMAL_ENCRYPTION, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }

            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: NUM_OF_SIGNUPS,
            })

            await expect(genWitness(circuit, inputs)).rejects.toThrow();
        })

        it('should throw if deactivatedTreePathElements passed to the circuit are invalid', async () => {
            const NUM_OF_SIGNUPS = 1;
            const VOTE_WEIGHT = voteWeight;
            const MESSAGE_PUB_KEY = new PubKey([BigInt(0), BigInt(0)]);
            const KEY_FOR_COORD_PART_OF_SHARED_KEY = coordinatorKeypair.pubKey;
            const DEACTIVATED_KEYS_TREE_ELEMENT_INDEX = 1; // Wrong index, should be 0
            const STATE_TREE_ELEMENT_INDEX = stateIndex;
            const KEY_FOR_ELGAMAL_ENCRYPTION = coordinatorKeypair.pubKey.rawPubKey;

            const salt = (new Keypair()).privKey.rawPrivKey

            // Key deactivation command
            const command = new PCommand(
                stateIndex, //BigInt(1),
                MESSAGE_PUB_KEY, // 0,0 PubKey
                voteOptionIndex, // 0,
                VOTE_WEIGHT, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
                salt,
            )

            const signature = command.sign(userKeypair.privKey)

            const ecdhKeypair = new Keypair()

            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                KEY_FOR_COORD_PART_OF_SHARED_KEY
            )

            // Encrypt command and publish
            const message = command.encrypt(signature, sharedKey)
            messages.push(message)

            const messageArr = [message];
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // ecdhKeypair.pubKey -> encPubKey
            const messageHash = message.hash(ecdhKeypair.pubKey);

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const mask = BigInt(Math.ceil(Math.random() * 1000))
            const maskingValues = [mask.toString()]

            const status = BigInt(1);
            const [c1, c2] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask
            )

            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())

            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            H = hash2([H0, messageHash])

            const encPubKeys = [ecdhKeypair.pubKey.asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }

            console.log(encPubKeys)

            const deactivatedTreePathElements = [deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements)
            }
            
            const stateLeafPathElements = [maciState.stateTree.genMerklePath(STATE_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }

            const currentStateLeaves = [maciState.stateLeaves[1].asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }

            const elGamalEnc = [[c1, c2]]
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    KEY_FOR_ELGAMAL_ENCRYPTION, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }

            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: NUM_OF_SIGNUPS,
            })

            await expect(genWitness(circuit, inputs)).rejects.toThrow();
        })

        it('should throw if stateLeafPathElements passed to the circuit are invalid', async () => {
            const NUM_OF_SIGNUPS = 1;
            const VOTE_WEIGHT = voteWeight;
            const MESSAGE_PUB_KEY = new PubKey([BigInt(0), BigInt(0)]);
            const KEY_FOR_COORD_PART_OF_SHARED_KEY = coordinatorKeypair.pubKey;
            const DEACTIVATED_KEYS_TREE_ELEMENT_INDEX = 0; 
            const STATE_TREE_ELEMENT_INDEX = 0; // Wrong index, should be stateIndex var
            const KEY_FOR_ELGAMAL_ENCRYPTION = coordinatorKeypair.pubKey.rawPubKey;

            const salt = (new Keypair()).privKey.rawPrivKey

            // Key deactivation command
            const command = new PCommand(
                stateIndex, //BigInt(1),
                MESSAGE_PUB_KEY, // 0,0 PubKey
                voteOptionIndex, // 0,
                VOTE_WEIGHT, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
                salt,
            )

            const signature = command.sign(userKeypair.privKey)

            const ecdhKeypair = new Keypair()

            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                KEY_FOR_COORD_PART_OF_SHARED_KEY
            )

            // Encrypt command and publish
            const message = command.encrypt(signature, sharedKey)
            messages.push(message)

            const messageArr = [message];
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // ecdhKeypair.pubKey -> encPubKey
            const messageHash = message.hash(ecdhKeypair.pubKey);

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const mask = BigInt(Math.ceil(Math.random() * 1000))
            const maskingValues = [mask.toString()]

            const status = BigInt(1);
            const [c1, c2] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask
            )

            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())

            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            H = hash2([H0, messageHash])

            const encPubKeys = [ecdhKeypair.pubKey.asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }

            console.log(encPubKeys)

            const deactivatedTreePathElements = [deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements)
            }
            
            const stateLeafPathElements = [maciState.stateTree.genMerklePath(STATE_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }

            const currentStateLeaves = [maciState.stateLeaves[1].asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }

            const elGamalEnc = [[c1, c2]]
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    KEY_FOR_ELGAMAL_ENCRYPTION, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }

            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: NUM_OF_SIGNUPS,
            })

            await expect(genWitness(circuit, inputs)).rejects.toThrow();
        })

        it('should throw if pub key in the PCommand not special case [0, 0]', async () => {
            const NUM_OF_SIGNUPS = 1;
            const VOTE_WEIGHT = voteWeight;
            const MESSAGE_PUB_KEY = new PubKey([BigInt(1), BigInt(0)]);// Wrong pub key, must be 0,0 for this special case of deactivation
            const KEY_FOR_COORD_PART_OF_SHARED_KEY = coordinatorKeypair.pubKey;
            const DEACTIVATED_KEYS_TREE_ELEMENT_INDEX = 0; 
            const STATE_TREE_ELEMENT_INDEX = stateIndex;
            const KEY_FOR_ELGAMAL_ENCRYPTION = coordinatorKeypair.pubKey.rawPubKey;

            const salt = (new Keypair()).privKey.rawPrivKey

            // Key deactivation command
            const command = new PCommand(
                stateIndex, //BigInt(1),
                MESSAGE_PUB_KEY, // 0,0 PubKey
                voteOptionIndex, // 0,
                VOTE_WEIGHT, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
                salt,
            )

            const signature = command.sign(userKeypair.privKey)

            const ecdhKeypair = new Keypair()

            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                KEY_FOR_COORD_PART_OF_SHARED_KEY
            )

            // Encrypt command and publish
            const message = command.encrypt(signature, sharedKey)
            messages.push(message)

            const messageArr = [message];
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // ecdhKeypair.pubKey -> encPubKey
            const messageHash = message.hash(ecdhKeypair.pubKey);

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const mask = BigInt(Math.ceil(Math.random() * 1000))
            const maskingValues = [mask.toString()]

            const status = BigInt(1);
            const [c1, c2] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask
            )

            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())

            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            H = hash2([H0, messageHash])

            const encPubKeys = [ecdhKeypair.pubKey.asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }

            console.log(encPubKeys)

            const deactivatedTreePathElements = [deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements)
            }
            
            const stateLeafPathElements = [maciState.stateTree.genMerklePath(STATE_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }

            const currentStateLeaves = [maciState.stateLeaves[1].asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }

            const elGamalEnc = [[c1, c2]]
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    KEY_FOR_ELGAMAL_ENCRYPTION, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }

            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: NUM_OF_SIGNUPS,
            })

            await expect(genWitness(circuit, inputs)).rejects.toThrow();
        })

        it('should throw if voteWeight in the PCommand not 0', async () => {
            const NUM_OF_SIGNUPS = 1;
            const VOTE_WEIGHT = BigInt(1); // Wrong vote weight, should be voteWeight var
            const MESSAGE_PUB_KEY = new PubKey([BigInt(0), BigInt(0)]);
            const KEY_FOR_COORD_PART_OF_SHARED_KEY = coordinatorKeypair.pubKey;
            const DEACTIVATED_KEYS_TREE_ELEMENT_INDEX = 0; 
            const STATE_TREE_ELEMENT_INDEX = stateIndex;
            const KEY_FOR_ELGAMAL_ENCRYPTION = coordinatorKeypair.pubKey.rawPubKey;

            const salt = (new Keypair()).privKey.rawPrivKey

            // Key deactivation command
            const command = new PCommand(
                stateIndex, //BigInt(1),
                MESSAGE_PUB_KEY, // 0,0 PubKey
                voteOptionIndex, // 0,
                VOTE_WEIGHT, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
                salt,
            )

            const signature = command.sign(userKeypair.privKey)

            const ecdhKeypair = new Keypair()

            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                KEY_FOR_COORD_PART_OF_SHARED_KEY
            )

            // Encrypt command and publish
            const message = command.encrypt(signature, sharedKey)
            messages.push(message)

            const messageArr = [message];
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // ecdhKeypair.pubKey -> encPubKey
            const messageHash = message.hash(ecdhKeypair.pubKey);

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const mask = BigInt(Math.ceil(Math.random() * 1000))
            const maskingValues = [mask.toString()]

            const status = BigInt(1);
            const [c1, c2] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask
            )

            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())

            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            H = hash2([H0, messageHash])

            const encPubKeys = [ecdhKeypair.pubKey.asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }

            console.log(encPubKeys)

            const deactivatedTreePathElements = [deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements)
            }
            
            const stateLeafPathElements = [maciState.stateTree.genMerklePath(STATE_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }

            const currentStateLeaves = [maciState.stateLeaves[1].asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }

            const elGamalEnc = [[c1, c2]]
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    KEY_FOR_ELGAMAL_ENCRYPTION, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }

            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: NUM_OF_SIGNUPS,
            })

            await expect(genWitness(circuit, inputs)).rejects.toThrow();
        })

        it('should throw if elgamalEncryption not performed with coordination pub key', async () => {
            const NUM_OF_SIGNUPS = 1;
            const VOTE_WEIGHT = voteWeight;
            const MESSAGE_PUB_KEY = new PubKey([BigInt(0), BigInt(0)]);
            const KEY_FOR_COORD_PART_OF_SHARED_KEY = coordinatorKeypair.pubKey;
            const DEACTIVATED_KEYS_TREE_ELEMENT_INDEX = 0; 
            const STATE_TREE_ELEMENT_INDEX = stateIndex;
            const ecdhKeypair = new Keypair()
            const KEY_FOR_ELGAMAL_ENCRYPTION = ecdhKeypair.pubKey.rawPubKey; // wrong pub key, should be coordinators

            const salt = (new Keypair()).privKey.rawPrivKey

            // Key deactivation command
            const command = new PCommand(
                stateIndex, //BigInt(1),
                MESSAGE_PUB_KEY, // 0,0 PubKey
                voteOptionIndex, // 0,
                VOTE_WEIGHT, // vote weight
                BigInt(2), // nonce
                BigInt(pollId),
                salt,
            )

            const signature = command.sign(userKeypair.privKey)

            const sharedKey = Keypair.genEcdhSharedKey(
                ecdhKeypair.privKey,
                KEY_FOR_COORD_PART_OF_SHARED_KEY
            )

            // Encrypt command and publish
            const message = command.encrypt(signature, sharedKey)
            messages.push(message)

            const messageArr = [message];
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                messageArr.push(new Message(BigInt(0), Array(10).fill(BigInt(0))))
            }

            // ecdhKeypair.pubKey -> encPubKey
            const messageHash = message.hash(ecdhKeypair.pubKey);

            const DEACT_TREE_ARITY = 5;

            const deactivatedKeys = new IncrementalQuinTree(
                STATE_TREE_DEPTH,
                H0,
                DEACT_TREE_ARITY,
                hash5,
            )

            const mask = BigInt(Math.ceil(Math.random() * 1000))
            const maskingValues = [mask.toString()]

            const status = BigInt(1);
            const [c1, c2] = elGamalEncryptBit(
                coordinatorKeypair.pubKey.rawPubKey, 
                status, 
                mask
            )

            console.log(maciState.stateLeaves[1])
            console.log(userKeypair.pubKey)
            console.log(maciState.stateLeaves[1].asCircuitInputs())

            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                maskingValues.push('1')
            }

            deactivatedKeys.insert( (new DeactivatedKeyLeaf(
                userKeypair.pubKey,
                c1,
                c2,
                salt,
            )).hash())

            H = hash2([H0, messageHash])

            const encPubKeys = [ecdhKeypair.pubKey.asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                encPubKeys.push(new PubKey([BigInt(0), BigInt(0)]).asCircuitInputs());
            }

            console.log(encPubKeys)

            const deactivatedTreePathElements = [deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                deactivatedTreePathElements.push(deactivatedKeys.genMerklePath(DEACTIVATED_KEYS_TREE_ELEMENT_INDEX).pathElements)
            }
            
            const stateLeafPathElements = [maciState.stateTree.genMerklePath(STATE_TREE_ELEMENT_INDEX).pathElements];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                stateLeafPathElements.push(maciState.stateTree.genMerklePath(0).pathElements)
            }

            const currentStateLeaves = [maciState.stateLeaves[1].asCircuitInputs()];
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                currentStateLeaves.push(maciState.stateLeaves[0].asCircuitInputs())
            }

            const elGamalEnc = [[c1, c2]]
            // Pad array
            for (let i = 1; i < maxValues.maxMessages; i += 1) {
                elGamalEnc.push(elGamalEncryptBit(
                    KEY_FOR_ELGAMAL_ENCRYPTION, 
                    BigInt(0), 
                    BigInt(1)
                ))
            }

            const inputs = stringifyBigInts({
                coordPrivKey: coordinatorKeypair.privKey.asCircuitInputs(),
                coordPubKey: coordinatorKeypair.pubKey.rawPubKey,
                encPubKeys,
                msgs: messageArr.map(m => m.asCircuitInputs()),
                deactivatedTreePathElements,
                stateLeafPathElements,
                currentStateLeaves,
                elGamalEnc,
                maskingValues,
                deactivatedTreeRoot: deactivatedKeys.root,
                currentStateRoot: maciState.stateTree.root,
                numSignUps: NUM_OF_SIGNUPS,
            })

            await expect(genWitness(circuit, inputs)).rejects.toThrow();
        })
    })
})
