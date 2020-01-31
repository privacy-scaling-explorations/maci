import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')
import * as fs from 'fs'
import {
    StateLeaf,
    Command,
    Message,
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
    PubKey,
    bigInt,
    genKeyPair,
    genPrivKey,
    stringifyBigInts,
    unstringifyBigInts,
    formatPrivKeyForBabyJub,
    genEcdhSharedKey,
    genPubKey,
    Keypair,
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

import { config } from 'maci-config'
import { str2BigInt } from './utils'

jest.setTimeout(90000)

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
    const user = genKeyPair()

    const ephemeralKeypair = genKeyPair()

    const userVoteOptionTree = setupTree(2, NOTHING_UP_MY_SLEEVE)
    for (let i = 0; i < voteOptionLength; i++) {
        // Vote for no-one by default
        userVoteOptionTree.insert(hashOne(bigInt(0)), bigInt(0))
    }

    const userStateLeaf = new StateLeaf(
        user.pubKey,
        userVoteOptionTree.root, // User new vote option tree
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

const processMessage = (
    privKey: PrivKey,
    pubKey: PubKey,
    msg: Message,
    oldStateTree: MerkleTree,
    oldUserVoteOptionTree: MerkleTree,
) => {

    const stateTree = oldStateTree.copy()
    const userVoteOptionTree = oldUserVoteOptionTree.copy()

    // Decrypt the msg and extract relevant parts of it
    const sharedKey = genEcdhSharedKey(privKey, pubKey)
    const { command, signature } = Command.decrypt(msg, sharedKey)

    const stateLeaf = stateTree.leavesRaw[command.stateIndex]

    const msgSigPubKey = stateLeaf.pubKey

    // If Index is invalid, return
    if (parseInt(command.stateIndex) >= parseInt(stateTree.nextIndex)) {
        return [
            stateTree,
            userVoteOptionTree
        ]
    }

    // If the signature isn't valid, do nothing
    if (!command.verifySignature(signature, msgSigPubKey)) {
        return {
            stateTree,
            userVoteOptionTree
        }
    }

    // If the nonce isn't valid, do nothing
    if (!command.nonce.equals(stateLeaf.nonce + bigInt(1))) {
        return [
            stateTree,
            userVoteOptionTree
        ]
    }

    // If there are insufficient vote credits, do nothing
    const userPrevSpentCred =
        userVoteOptionTree.leavesRaw[
            parseInt(command.voteOptionIndex)
        ]
    const userCmdVoteOptionCredit = command.newVoteWeight

    const voteCreditsLeft = stateLeaf.voiceCreditBalance + (userPrevSpentCred * userPrevSpentCred) - (userCmdVoteOptionCredit * userCmdVoteOptionCredit)

    if (voteCreditsLeft < 0) {
        return [
            stateTree,
            userVoteOptionTree
        ]
    }

    userVoteOptionTree.update(
        bigInt(command.voteOptionIndex),
        hashOne(bigInt(userCmdVoteOptionCredit)),
        bigInt(userCmdVoteOptionCredit)
    )

    const newStateLeaf = new StateLeaf(
        command.newPubKey,
        userVoteOptionTree.root,
        voteCreditsLeft,
        stateLeaf.nonce + bigInt(1)
    )

    stateTree.update(
        command.stateIndex,
        newStateLeaf.hash(),
        newStateLeaf,
    )

    return {
        stateTree,
        userVoteOptionTree
    }
}

describe('Batch state tree root update verification circuit', () => {
    let circuit

    // Set up keypairs
    const user1 = genKeyPair()
    const coordinator = genKeyPair()
    const ephemeralKeypair = genKeyPair()

    beforeAll(async () => {
        // Compile circuit
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/batchUpdateStateTree_test.circom'))
        circuit = new Circuit(circuitDef)
    })

    it('should process valid inputs correctly', async () => {
        const treeDepth = 4
        const voteOptionTreeDepth = 2
        // Construct the trees
        const msgTree = setupTree(treeDepth, NOTHING_UP_MY_SLEEVE)
        let stateTree = setupTree(treeDepth, NOTHING_UP_MY_SLEEVE)
        const voteOptionTree = setupTree(voteOptionTreeDepth, NOTHING_UP_MY_SLEEVE)

        // Insert candidates into vote option tree
        voteOptionTree.insert(hashOne(str2BigInt('candidate 1')))
        voteOptionTree.insert(hashOne(str2BigInt('candidate 2')))
        voteOptionTree.insert(hashOne(str2BigInt('candidate 3')))
        voteOptionTree.insert(hashOne(str2BigInt('candidate 4')))

        // Register users into the stateTree.
        // stateTree index 0 is a random leaf used to insert random data when the
        // decryption fails
        stateTree.insert(hashOne(str2BigInt('random data')))

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
        let msgs: Message[] = []
        let cmds: Command[] = []

        for (let i = 0; i < batchSize; i++) {
            const voteOptionIndex = randomRange(0, voteOptionLength)
            const voteOptionWeight = randomRange(0, 8)
            const user = users[i]
            const salt = genRandomSalt()

            const cmd = new Command(
                user.userIndex,
                user.user.pubKey,
                bigInt(voteOptionIndex),
                bigInt(voteOptionWeight),
                user.nonce + bigInt(1),
                salt
            )

            const sig = cmd.sign(user.user.privKey)

            const sharedKey = genEcdhSharedKey(user.ephemeralKeypair.privKey, coordinator.pubKey)
            const msg = cmd.encrypt(sig, sharedKey)

            cmds.push(cmd)
            msgs.push(msg)
        }

        // Insert user messages into msg tree
        let msgIdxs: number[] = []
        for (let i = 0; i < batchSize; i++) {
            msgTree.insert(msgs[i].hash())
            msgIdxs.push(msgTree.nextIndex - 1)
        }

        // Generate circuit inputs
        let msgTreeBatchPathElements: SnarkBigInt[] = []
        let msgTreeBatchPathIndexes: SnarkBigInt[] = []
        const msgTreeBatchStartIndex = msgIdxs[0]

        let stateTreeBatchRaw: SnarkBigInt[] = []
        let stateTreeBatchRoot: SnarkBigInt[] = []
        let stateTreeBatchPathElements: SnarkBigInt[] = []
        let stateTreeBatchPathIndexes: SnarkBigInt[] = []

        let userVoteOptionsBatchRoot: SnarkBigInt[] = []
        let userVoteOptionsBatchPathElements: SnarkBigInt[] = []
        let userVoteOptionsBatchPathIndexes: SnarkBigInt[] = []

        let voteOptionTreeBatchLeafRaw: SnarkBigInt[] = []

        let ecdhPublicKeyBatch: PubKey[] = []

        for (let i = 0; i < batchSize; i++) {
            // Get relevant Merkle paths
            const cmd = cmds[i]
            const msg = msgs[i]
            const user = users[i]

            const [
                msgTreePathElements,
                msgTreePathIndexes
            ] = msgTree.getPathUpdate(msgIdxs[i])

            msgTreeBatchPathElements.push(msgTreePathElements)
            msgTreeBatchPathIndexes.push(msgTreePathIndexes)

            const [
                stateTreePathElements,
                stateTreePathIndexes
            ] = stateTree.getPathUpdate(user.userIndex)

            stateTreeBatchRaw.push(
                stateTree.leavesRaw[user.userIndex]
            )

            stateTreeBatchRoot.push(stateTree.root)
            stateTreeBatchPathElements.push(stateTreePathElements)
            stateTreeBatchPathIndexes.push(stateTreePathIndexes)

            const userVoteOptionIndex = cmd.voteOptionIndex

            const [
                userVoteOptionsPathElements,
                userVoteOptionsPathIndexes
            ] = user.userVoteOptionTree.getPathUpdate(userVoteOptionIndex)

            userVoteOptionsBatchRoot.push(user.userVoteOptionTree.root)
            userVoteOptionsBatchPathElements.push(userVoteOptionsPathElements)
            userVoteOptionsBatchPathIndexes.push(userVoteOptionsPathIndexes)

            voteOptionTreeBatchLeafRaw.push(user.userVoteOptionTree.leavesRaw[userVoteOptionIndex])

            ecdhPublicKeyBatch.push(user.ephemeralKeypair.pubKey)

            // Process command in state tree
            // acc stands for accumulator
            const accData: any = processMessage(
                coordinator.privKey,
                user.ephemeralKeypair.pubKey,
                msg,
                stateTree,
                user.userVoteOptionTree
            )

            stateTree = accData.stateTree
            user.userVoteOptionTree = accData.userVoteOptionTree
        }

        const stateTreeMaxIndex = bigInt(stateTree.nextIndex - 1)
        const voteOptionsMaxIndex = bigInt(voteOptionTree.nextIndex - 1)

        // After processing all commands, insert random leaf
        const randomLeafRoot = stateTree.root
        const randomLeaf = genRandomSalt()
        const [
            randomLeafPathElements,
            _
        ] = stateTree.getPathUpdate(0)

        const d = {
            'coordinator_public_key': coordinator.pubKey,
            'message': msgs.map((x) => x.asCircuitInputs()),
            'msg_tree_root': msgTree.root,
            'msg_tree_path_elements': msgTreeBatchPathElements,
            'msg_tree_batch_start_index': msgTreeBatchStartIndex,
            'random_leaf': randomLeaf,
            'random_leaf_root': randomLeafRoot,
            'random_leaf_path_elements': randomLeafPathElements,
            'vote_options_leaf_raw': voteOptionTreeBatchLeafRaw,
            'vote_options_tree_root': userVoteOptionsBatchRoot,
            'vote_options_tree_path_elements': userVoteOptionsBatchPathElements,
            'vote_options_tree_path_index': userVoteOptionsBatchPathIndexes,
            'vote_options_max_leaf_index': voteOptionsMaxIndex,
            'state_tree_data_raw': stateTreeBatchRaw.map((x) => x.asCircuitInputs()),
            'state_tree_max_leaf_index': stateTreeMaxIndex,
            'state_tree_root': stateTreeBatchRoot,
            'state_tree_path_elements': stateTreeBatchPathElements,
            'state_tree_path_index': stateTreeBatchPathIndexes,
            'ecdh_private_key': formatPrivKeyForBabyJub(coordinator.privKey),
            'ecdh_public_key': ecdhPublicKeyBatch
        }

        const circuitInputs = stringifyBigInts(d)

        const witness = circuit.calculateWitness(circuitInputs)
        const idx = circuit.getSignalIdx('main.root')
        const circuitNewStateRoot = witness[idx].toString()

        // Finally update state tree random leaf
        stateTree.update(0, randomLeaf)

        expect(stateTree.root.toString()).toEqual(circuitNewStateRoot)

        // Generate a proof. This is commented as it takes several minutes to run.
        //const proof = await genProof(witness, provingKey)
        //const publicSignals = genPublicSignals(witness, circuit)

        //const isValid = verifyProof(verifyingKey, proof, publicSignals)
        //expect(isValid).toBeTruthy()
    })
})
