
import {
    compileAndLoadCircuit,
} from '../'

import {
    Keypair,
    StateLeaf,
    Command,
    Message,
} from 'maci-domainobjs'
import {
    IncrementalQuadTree,
    genRandomSalt,
    bigInt,
    stringifyBigInts,
    NOTHING_UP_MY_SLEEVE,
} from 'maci-crypto'

import { config } from 'maci-config'

const getUpdateStateTreeParams = async (
    userCmd: Command, 
    user: Keypair,
    coordinator: Keypair,
    ephemeralKeypair: Keypair,
) => {

    // Construct the trees
    const stateTree = new IncrementalQuadTree(
        config.maci.merkleTrees.stateTreeDepth,
        NOTHING_UP_MY_SLEEVE,
    )
    const msgTree = new IncrementalQuadTree(
        config.maci.merkleTrees.messageTreeDepth,
        NOTHING_UP_MY_SLEEVE,
    )
    const user1VoteOptionTree = new IncrementalQuadTree(
        config.maci.merkleTrees.voteOptionTreeDepth, 
        NOTHING_UP_MY_SLEEVE,
    )

    // Register users into the stateTree.
    // stateTree index 0 is a random leaf used to insert random data when the
    // decryption fails
    stateTree.insert(genRandomSalt())

    // Insert this user's votes into the vote option tree

    // Vote for option 1
    user1VoteOptionTree.insert(bigInt(1))
    user1VoteOptionTree.insert(bigInt(0))
    user1VoteOptionTree.insert(bigInt(0))
    user1VoteOptionTree.insert(bigInt(0))

    // Register user 1
    const user1ExistingStateLeaf = new StateLeaf(
        user.pubKey,
        user1VoteOptionTree.root, // vote option tree root
        bigInt(125), // credit balance (100 is arbitrary for now)
        bigInt(0) // nonce
    )

    stateTree.insert(user1ExistingStateLeaf.hash())

    const user1StateTreeIndex = stateTree.nextIndex - 1

    // Insert more random data as we just want to validate user 1
    stateTree.insert(genRandomSalt())
    stateTree.insert(genRandomSalt())

    // Construct user 1 command
    // Note: command is unencrypted, message is encrypted
    const user1VoteOptionIndex = 0

    // Generate an ECDH shared key
    const ecdhSharedKey = Keypair.genEcdhSharedKey(ephemeralKeypair.privKey, coordinator.pubKey)

    // Sign and encrypt the user's message
    const sig = userCmd.sign(user.privKey)
    const user1Message: Message = userCmd.encrypt(sig, ecdhSharedKey)

    // Insert random data (as we just want to process 1 command)
    msgTree.insert(genRandomSalt())
    msgTree.insert(genRandomSalt())
    msgTree.insert(genRandomSalt())
    msgTree.insert(genRandomSalt())

    // Insert user 1's command into command tree
    msgTree.insert(user1Message.hash()) // Note that this is at index 4
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
    const voteOptionsProof = user1VoteOptionTree.getPathUpdate(user1VoteOptionIndex)

    const curVoteOptionTreeLeafRaw = user1VoteOptionTree.getLeaf(user1VoteOptionIndex)

    const stateTreeMaxIndex = bigInt(stateTree.nextIndex - 1)

    const user1VoteOptionsTreeMaxIndex = bigInt(stateTree.nextIndex - 1)

    const circuitInputs = stringifyBigInts({
        'coordinator_public_key': coordinator.pubKey.asCircuitInputs(),
        'ecdh_private_key': coordinator.privKey.asCircuitInputs(),
        'ecdh_public_key': ephemeralKeypair.pubKey.asCircuitInputs(),
        'message': user1Message.asCircuitInputs(),
        'msg_tree_root': msgTree.root,
        'msg_tree_path_elements': msgTreePathElements,
        'msg_tree_path_index': msgTreePathIndexes,
        'vote_options_leaf_raw': curVoteOptionTreeLeafRaw,
        'vote_options_tree_root': user1VoteOptionTree.root,
        'vote_options_tree_path_elements': voteOptionsProof[0],
        'vote_options_tree_path_index': voteOptionsProof[1],
        'vote_options_max_leaf_index': user1VoteOptionsTreeMaxIndex,
        'state_tree_data_raw': user1ExistingStateLeaf.asCircuitInputs(),
        'state_tree_max_leaf_index': stateTreeMaxIndex,
        'state_tree_root': stateTree.root,
        'state_tree_path_elements': stateTreePathElements,
        'state_tree_path_index': stateTreePathIndexes,
    })

    return {
        circuitInputs,
        stateTree,
        msgTree,
        userVoteOptionTree: user1VoteOptionTree
    }
}


describe('State tree root update verification circuit', () => {
    let circuit 

    // Set up keypairs
    const user1 = new Keypair()
    const coordinator = new Keypair()
    const ephemeralKeypair = new Keypair()

    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('test/updateStateTree_test.circom')
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
        )

        const {
            circuitInputs,
            userVoteOptionTree,
            stateTree,
        } = await getUpdateStateTreeParams(
            user1Command,
            user1,
            coordinator,
            ephemeralKeypair,
        )

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const idx = circuit.getSignalIdx('main.root')
        const circuitNewStateRoot = witness[idx].toString()
        
        const user1VoteOptionTree = userVoteOptionTree
        const curVoteOptionTreeLeafRaw = user1VoteOptionTree.getLeaf(user1VoteOptionIndex)

        // Update user vote option tree
        // (It replaces the value)
        user1VoteOptionTree.update(
            user1VoteOptionIndex,
            bigInt(user1VoteOptionWeight),
        )

        // Update state tree leaf (refer to user1Command)
        const newStateTreeLeaf = new StateLeaf(
            user1.pubKey,
            user1VoteOptionTree.root, // User new vote option tree
            bigInt(125) + 
                bigInt(curVoteOptionTreeLeafRaw * curVoteOptionTreeLeafRaw) - 
                bigInt(user1VoteOptionWeight * user1VoteOptionWeight), // Vote Balance
            bigInt(1) // Nonce
        )

        stateTree.update(
            user1StateTreeIndex,
            newStateTreeLeaf.hash(),
        )

        const jsNewStateRoot = stateTree.root.toString()

        // Make sure js generated root and circuit root match
        expect(circuitNewStateRoot.toString()).toEqual(jsNewStateRoot.toString())
    })

    it('The UpdateStateTree snark should pass even if the nonce is invalid', async () => {
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
            // Invalid nonce
            bigInt(0),
        )

        const {
            circuitInputs,
            stateTree,
        } = await getUpdateStateTreeParams(
            user1Command,
            user1,
            coordinator,
            ephemeralKeypair,
        )

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const idx = circuit.getSignalIdx('main.root')
        const circuitNewStateRoot = witness[idx].toString()

        const jsNewStateRoot = stateTree.root.toString()

        // Make sure js generated root and circuit root match
        expect(circuitNewStateRoot.toString()).toEqual(jsNewStateRoot.toString())
    })

    it('The UpdateStateTree snark should pass even if the signature is invalid', async () => {
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
            // Invalid nonce
            bigInt(0),
        )

        const wrongUser = new Keypair() // A random Keypair which should not be the user's
        expect(wrongUser.privKey.rawPrivKey.toString()).not.toEqual(user1.privKey.rawPrivKey.toString())

        const {
            circuitInputs,
            stateTree,
        } = await getUpdateStateTreeParams(
            user1Command,
            wrongUser,
            coordinator,
            ephemeralKeypair,
        )

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const idx = circuit.getSignalIdx('main.root')
        const circuitNewStateRoot = witness[idx].toString()

        const jsNewStateRoot = stateTree.root.toString()

        // Make sure js generated root and circuit root match
        expect(circuitNewStateRoot.toString()).toEqual(jsNewStateRoot.toString())
    })
})
