import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')
import {
    StateLeaf,
    Command,
    Message,
} from 'maci-domainobjs'
import {
    setupTree,
    genRandomSalt,
    Plaintext,
    Ciphertext,
    hashOne,
    hash,
    SnarkBigInt,
    PrivKey,
    bigInt,
    genKeyPair,
    genPrivKey,
    stringifyBigInts,
    unstringifyBigInts,
    formatPrivKeyForBabyJub,
    genEcdhSharedKey,
} from 'maci-crypto'

import { config } from 'maci-config'

const ZERO_VALUE = bigInt(config.merkleTrees.zeroValue)

const str2BigInt = (s: string): SnarkBigInt => {
  return bigInt(parseInt(
    Buffer.from(s).toString('hex'), 16
  ))
}

describe('State tree root update verification circuit', () => {
    let circuit 

    // Set up keypairs
    const user1 = genKeyPair()
    const coordinator = genKeyPair()
    const ephemeralKeypair = genKeyPair()
    const ecdhSharedKey = genEcdhSharedKey(
        ephemeralKeypair.privKey,
        coordinator.pubKey,
    )

    const getUpdateStateTreeParams = async (
        userCmd: Command, 
        userPrivKey: PrivKey,
        encryptionKey: PrivKey,
    ) => {
        // Construct the trees
        const voteOptionTree = setupTree(2, ZERO_VALUE)
        const msgTree = setupTree(4, ZERO_VALUE)
        const stateTree = setupTree(4, ZERO_VALUE)

        // Insert candidates into vote option tree
        voteOptionTree.insert(hashOne(str2BigInt('candidate 1')))
        voteOptionTree.insert(hashOne(str2BigInt('candidate 2')))
        voteOptionTree.insert(hashOne(str2BigInt('candidate 3')))
        voteOptionTree.insert(hashOne(str2BigInt('candidate 4')))

        // Register users into the stateTree.
        // stateTree index 0 is a random leaf used to insert random data when the
        // decryption fails
        stateTree.insert(hashOne(str2BigInt('random data')))

        // User 1's vote option tree
        const user1VoteOptionTree = setupTree(2, ZERO_VALUE)

        // Insert this user's votes into the vote option tree

        // Vote for option 1
        // TODO: figure out why not use user1VoteOptionTree.insert(hashOne(bigInt(1)))
        user1VoteOptionTree.insert(hashOne(bigInt(1)), bigInt(1)) 

        user1VoteOptionTree.insert(hashOne(bigInt(0)))
        user1VoteOptionTree.insert(hashOne(bigInt(0)))
        user1VoteOptionTree.insert(hashOne(bigInt(0)))

        // Register user 1
        const user1ExistingStateLeaf = new StateLeaf(
            user1.pubKey,
            user1VoteOptionTree.root, // vote option tree root
            bigInt(125), // credit balance (100 is arbitrary for now)
            bigInt(0) // nonce
        )

        stateTree.insert(user1ExistingStateLeaf.hash())

        const user1StateTreeIndex = stateTree.nextIndex - 1

        // Insert more random data as we just want to validate user 1
        stateTree.insert(hashOne(genPrivKey()))
        stateTree.insert(hashOne(genPrivKey()))

        // Construct user 1 command
        // Note: command is unencrypted, message is encrypted
        const user1VoteOptionIndex = 0
        const user1Command = userCmd

        // Sign and encrypt user message
        const sig = user1Command.sign(userPrivKey)
        const user1Message: Message = user1Command.encrypt(encryptionKey, sig)

        // Insert random data (as we just want to process 1 command)
        msgTree.insert(hash([bigInt(0), genPrivKey()]))
        msgTree.insert(hash([bigInt(1), genPrivKey()]))
        msgTree.insert(hash([bigInt(2), genPrivKey()]))
        msgTree.insert(hash([bigInt(3), genPrivKey()]))

        // Insert user 1 command into command tree
        msgTree.insert(hash(user1Message)) // Note that this is at index 4
        const user1MsgTreeIndex = msgTree.nextIndex - 1

        // Generate circuit inputs
        const [
            msgTreePathElements,
            msgTreePathIndexes
        ] = msgTree.getPathUpdate(user1MsgTreeIndex)

        const [
            stateTreePathElements,
            stateTreePathIndexes
        ] = stateTree.getPathUpdate(user1StateTreeIndex)

        // Get the vote options tree path elements
        const [
            user1VoteOptionsPathElements,
            user1VoteOptionsPathIndexes
        ] = user1VoteOptionTree.getPathUpdate(user1VoteOptionIndex)

        const curVoteOptionTreeLeafRaw = user1VoteOptionTree.leavesRaw[user1VoteOptionIndex]

        const stateTreeMaxIndex = BigInt(stateTree.nextIndex - 1)

        const user1VoteOptionsTreeMaxIndex = BigInt(stateTree.nextIndex - 1)

        const circuitInputs = stringifyBigInts({
            'coordinator_public_key': coordinator.pubKey,
            'message': user1Message.asCircuitInputs(),
            'msg_tree_root': msgTree.root,
            'msg_tree_path_elements': msgTreePathElements,
            'msg_tree_path_index': msgTreePathIndexes,
            'vote_options_leaf_raw': curVoteOptionTreeLeafRaw,
            'vote_options_tree_root': user1VoteOptionTree.root,
            'vote_options_tree_path_elements': user1VoteOptionsPathElements,
            'vote_options_tree_path_index': user1VoteOptionsPathIndexes,
            'vote_options_max_leaf_index': user1VoteOptionsTreeMaxIndex,
            'state_tree_data_raw': user1ExistingStateLeaf.asCircuitInputs(),
            'state_tree_max_leaf_index': stateTreeMaxIndex,
            'state_tree_root': stateTree.root,
            'state_tree_path_elements': stateTreePathElements,
            'state_tree_path_index': stateTreePathIndexes,
            'ecdh_private_key': formatPrivKeyForBabyJub(coordinator.privKey),
            'ecdh_public_key': ephemeralKeypair.pubKey,
        })

        debugger

        return {
            circuit,
            circuitInputs,
            stateTree,
            msgTree,
            userVoteOptionTree: user1VoteOptionTree
        }
    }

    beforeAll(async () => {
        // Compile circuit
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/updateStateTree_test.circom'))
        circuit = new Circuit(circuitDef)

    })

    it('UpdateStateTree should produce the correct state root', async () => {
        const user1StateTreeIndex = 1
        const user1VoteOptionIndex = 0
        const user1VoteOptionWeight = 5

        const user1Command = new Command(
            bigInt(user1StateTreeIndex), // user index in state tree
            user1.pubKey,
            // Vote option index (voting for candidate 0)
            bigInt(user1VoteOptionIndex),
            // sqrt of the number of voice credits user wishes to spend (spending 25 credit balance)
            bigInt(user1VoteOptionWeight),
            // Nonce
            bigInt(1),
            // Random salt
            genRandomSalt()
        )

        const {
            circuit,
            circuitInputs,
            stateTree,
            userVoteOptionTree
        } = await getUpdateStateTreeParams(user1Command, user1.privKey, ecdhSharedKey)

        const user1VoteOptionTree = userVoteOptionTree
        const curVoteOptionTreeLeafRaw = user1VoteOptionTree.leavesRaw[user1VoteOptionIndex]

        debugger
        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const idx = circuit.getSignalIdx('main.root')
        const circuitNewStateRoot = witness[idx].toString()

        // Update user vote option tree
        // (It replaces the value)
        user1VoteOptionTree.update(
            user1VoteOptionIndex,
            hash(bigInt(user1VoteOptionWeight))
        )

        // Update state tree leaf (refer to user1Command)
        const newStateTreeLeaf = new StateLeaf(
            user1.pubKey,
            user1VoteOptionTree.root, // User new vote option tree
            bigInt(125) + bigInt(curVoteOptionTreeLeafRaw * curVoteOptionTreeLeafRaw) - BigInt(user1VoteOptionWeight * user1VoteOptionWeight), // Vote Balance
            bigInt(1) // Nonce
        )

        stateTree.update(
            user1StateTreeIndex,
            newStateTreeLeaf.hash()
        )

        const jsNewStateRoot = stateTree.root.toString()

        // Make sure js generated root and circuit root is similar
        expect(circuitNewStateRoot.toString()).toEqual(jsNewStateRoot.toString())
    })
})
