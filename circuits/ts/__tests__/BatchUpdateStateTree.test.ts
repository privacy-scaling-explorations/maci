import * as fs from 'fs'
import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import { str2BigInt } from './utils'
import { config } from 'maci-config'

import { 
    genBatchUstInputs,
    compileAndLoadCircuit,
} from '../'

import { 
    processMessage,
} from 'maci-core'

import {
    Keypair,
    StateLeaf,
    Command,
    Message,
    PubKey,
} from 'maci-domainobjs'

import {
    MerkleTree,
    setupTree,
    genRandomSalt,
    Plaintext,
    Ciphertext,
    hashOne,
    hash,
    SnarkBigInt,
    PrivKey,
    bigInt,
    stringifyBigInts,
    NOTHING_UP_MY_SLEEVE,
} from 'maci-crypto'

import {
    SnarkProvingKey,
    SnarkVerifyingKey,
    genProof,
    genPublicSignals,
    verifyProof,
    parseVerifyingKeyJson,
} from 'libsemaphore'

jest.setTimeout(1200000)

const provingKeyPath = path.join(__dirname, '../../build/batchUstPk.bin')
const provingKey: SnarkProvingKey = fs.readFileSync(provingKeyPath)

const verifyingKeyPath = path.join(__dirname, '../../build/batchUstVk.json')
const verifyingKey: SnarkVerifyingKey = parseVerifyingKeyJson(fs.readFileSync(verifyingKeyPath).toString())

const randomRange = (min: number, max:number) => {
  return Math.floor(Math.random() * (max - min) + min)
}

const createUser = (
    voteOptionLength: SnarkBigInt,
    creditBalance: SnarkBigInt = bigInt(125),
    nonce: SnarkBigInt = bigInt(0)
) => {
    // Helper function to create a user and their associated vote option tree
    const user = new Keypair()

    const ephemeralKeypair = new Keypair()

    const userVoteOptionTree = setupTree(voteOptionTreeDepth, NOTHING_UP_MY_SLEEVE)
    const voteWeight = bigInt(0)
    for (let i = 0; i < voteOptionLength; i++) {
        // Vote for no-one by default
        userVoteOptionTree.insert(voteWeight, voteWeight)
    }

    const userStateLeaf = new StateLeaf(
        user.pubKey,
        userVoteOptionTree.root,
        creditBalance,
        nonce,
    )

    return {
        user,
        ephemeralKeypair,
        nonce,
        userStateLeaf,
        userVoteOptionTree,
    }
}

/*
 * Returns a state tree and vote option tree based on a supplied message.
 * The trees returned are 
 */

const stateTreeDepth = config.maci.merkleTrees.stateTreeDepth
const messageTreeDepth = config.maci.merkleTrees.messageTreeDepth
const voteOptionTreeDepth = config.maci.merkleTrees.voteOptionTreeDepth

describe('Batch state tree root update verification circuit', () => {
    let circuit

    // Set up keypairs
    const user1 = new Keypair()
    const coordinator = new Keypair()
    const ephemeralKeypair = new Keypair()

    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('batchUpdateStateTree_test.circom')
    })

    it('should process valid inputs correctly', async () => {
        // Construct the trees
        const msgTree = setupTree(messageTreeDepth, NOTHING_UP_MY_SLEEVE)
        let stateTree = setupTree(stateTreeDepth, NOTHING_UP_MY_SLEEVE)

        // Register users into the stateTree.
        // stateTree index 0 is a random leaf used to insert random data when the
        // decryption fails
        stateTree.insert(NOTHING_UP_MY_SLEEVE)

        // Vote option length (not tree depth)
        const voteOptionLength = 2 ** voteOptionTreeDepth
        const batchSize = 4

        // Create and register users
        let users = {}
        for (let i = 0; i < batchSize; i++) {
            const {
                user,
                ephemeralKeypair,
                nonce,
                userStateLeaf,
                userVoteOptionTree,
            } = createUser(voteOptionLength)

            stateTree.insert(userStateLeaf.hash(), userStateLeaf)

            const stateTreeIndex = bigInt(stateTree.nextIndex - 1)

            users[i] = {
                user,
                ephemeralKeypair,
                nonce,
                userStateLeaf,
                userVoteOptionTree,
                userIndex: stateTreeIndex,
            }
        }

        // Create user commands and messages
        let batch: any[] = []

        for (let i = 0; i < batchSize; i++) {
            const voteOptionIndex = randomRange(0, voteOptionLength)
            const voteOptionWeight = randomRange(0, 8)
            const user = users[i]
            const salt = genRandomSalt()

            const command = new Command(
                user.userIndex,
                user.user.pubKey,
                bigInt(voteOptionIndex),
                bigInt(voteOptionWeight),
                user.nonce + bigInt(1),
                salt
            )

            const sig = command.sign(user.user.privKey)

            const sharedKey = Keypair.genEcdhSharedKey(
                user.ephemeralKeypair.privKey,
                coordinator.pubKey,
            )
            const message = command.encrypt(sig, sharedKey)

            // Insert a message into the msg tree
            msgTree.insert(message.hash())

            batch.push({ command, message })
        }

        // Generate circuit inputs
        let msgTreeBatchPathElements: SnarkBigInt[] = []
        const msgTreeBatchStartIndex = 0

        let stateTreeBatchRaw: SnarkBigInt[] = []
        let stateTreeBatchRoot: SnarkBigInt[] = []
        let stateTreeBatchPathElements: SnarkBigInt[] = []
        let stateTreeBatchPathIndices: SnarkBigInt[] = []

        let userVoteOptionsBatchRoot: SnarkBigInt[] = []
        let userVoteOptionsBatchPathElements: SnarkBigInt[] = []
        let userVoteOptionsBatchPathIndices: SnarkBigInt[] = []

        let voteOptionTreeBatchLeafRaw: SnarkBigInt[] = []

        let ecdhPublicKeyBatch: PubKey[] = []

        for (let i = 0; i < batchSize; i++) {
            // Get relevant Merkle paths
            const { command, message } = batch[i]
            const user = users[i]

            const [
                msgTreePathElements,
                _,
            ] = msgTree.getPathUpdate(i)

            msgTreeBatchPathElements.push(msgTreePathElements)

            const [
                stateTreePathElements,
                stateTreePathIndices
            ] = stateTree.getPathUpdate(user.userIndex)

            stateTreeBatchRaw.push(stateTree.leavesRaw[user.userIndex])

            stateTreeBatchRoot.push(stateTree.root)
            stateTreeBatchPathElements.push(stateTreePathElements)
            stateTreeBatchPathIndices.push(stateTreePathIndices)

            const userVoteOptionIndex = command.voteOptionIndex

            const [
                userVoteOptionsPathElements,
                userVoteOptionsPathIndices
            ] = user.userVoteOptionTree.getPathUpdate(userVoteOptionIndex)

            userVoteOptionsBatchRoot.push(user.userVoteOptionTree.root)
            userVoteOptionsBatchPathElements.push(userVoteOptionsPathElements)
            userVoteOptionsBatchPathIndices.push(userVoteOptionsPathIndices)

            voteOptionTreeBatchLeafRaw.push(user.userVoteOptionTree.leavesRaw[userVoteOptionIndex])

            ecdhPublicKeyBatch.push(user.ephemeralKeypair.pubKey)

            const ecdhSharedKey = Keypair.genEcdhSharedKey(
                coordinator.privKey,
                user.ephemeralKeypair.pubKey,
            )

            // Process the message
            const data = processMessage(
                ecdhSharedKey,
                message,
                stateTree,
                user.userVoteOptionTree
            )

            stateTree = data.stateTree
            user.userVoteOptionTree = data.userVoteOptionTree
        }

        const stateTreeMaxIndex = bigInt(stateTree.nextIndex - 1)
        const voteOptionsMaxIndex = bigInt(2 ** voteOptionTreeDepth - 1)

        // After processing all commands, insert a random leaf
        const randomLeafRoot = stateTree.root
        const randomStateLeaf = StateLeaf.genRandomLeaf()
        const [randomLeafPathElements, _] = stateTree.getPathUpdate(0)

        const circuitInputs = genBatchUstInputs(
            coordinator,
            batch.map((x) => x.message),
            ecdhPublicKeyBatch,
            msgTree,
            msgTreeBatchPathElements,
            msgTreeBatchStartIndex,
            randomStateLeaf,
            randomLeafRoot,
            randomLeafPathElements,
            voteOptionTreeBatchLeafRaw,
            userVoteOptionsBatchRoot,
            userVoteOptionsBatchPathElements,
            userVoteOptionsBatchPathIndices,
            voteOptionsMaxIndex,
            stateTreeBatchRaw,
            stateTreeMaxIndex,
            stateTreeBatchRoot,
            stateTreeBatchPathElements,
            stateTreeBatchPathIndices,
        )

        const witness = circuit.calculateWitness(circuitInputs)

        expect(circuit.checkWitness(witness)).toBeTruthy()

        const idx = circuit.getSignalIdx('main.root')
        const circuitNewStateRoot = witness[idx].toString()

        // Update the state tree with a random leaf
        stateTree.update(0, randomStateLeaf.hash(), randomStateLeaf)

        expect(stateTree.root.toString()).toEqual(circuitNewStateRoot)

        const publicSignals = genPublicSignals(witness, circuit)

        expect(publicSignals).toHaveLength(19)

        //// Generate a proof. This is commented as it takes several minutes to run.
        //const proof = await genProof(witness, provingKey)

        //const isValid = verifyProof(verifyingKey, proof, publicSignals)
        //expect(isValid).toBeTruthy()
    })
})
