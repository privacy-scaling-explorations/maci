const path = require('path')
const compiler = require('circom')
const { stringifyBigInts } = require('../_build/utils/helpers')
const { Circuit } = require('snarkjs')

const {
  randomPrivateKey,
  privateToPublicKey,
  signAndEncrypt,
  hash,
  multiHash,
  babyJubJubPrivateKey
} = require('../_build/utils/crypto')

const {
  createMerkleTree
} = require('../_build/utils/merkletree.js')

const str2BigInt = s => {
  return BigInt(parseInt(
    Buffer.from(s).toString('hex'), 16
  ))
}

const m = async () => {
  try {
    const circuitDef = await compiler(path.join(__dirname, 'circuits', 'update_state_tree_test.circom'))
    const circuit = new Circuit(circuitDef)

    // Key setup and generation
    const user1Sk = randomPrivateKey()
    const user1Pk = privateToPublicKey(user1Sk)

    const ephemeralSk = randomPrivateKey()
    const ephemeralPk = privateToPublicKey(ephemeralSk)

    const coordinatorSk = randomPrivateKey()
    const coordinatorPk = privateToPublicKey(coordinatorSk)

    // Contruct the tree(s))
    const voteOptionTree = createMerkleTree(2, 0n)
    const msgTree = createMerkleTree(4, 0n)
    const stateTree = createMerkleTree(4, 0n)

    // Insert candidates into vote option tree
    voteOptionTree.insert(hash(str2BigInt('candidate 1')))
    voteOptionTree.insert(hash(str2BigInt('candidate 2')))
    voteOptionTree.insert(hash(str2BigInt('candidate 3')))
    voteOptionTree.insert(hash(str2BigInt('candidate 4')))

    // Register users into the stateTree
    // stateTree index 0 is a random leaf
    // used to insert random data when the
    // decryption fails
    stateTree.insert(hash(str2BigInt('random data')))

    // User 1 vote option tree
    const user1VoteOptionTree = createMerkleTree(2, 0n)
    user1VoteOptionTree.insert(hash(0n))
    user1VoteOptionTree.insert(hash(0n))
    user1VoteOptionTree.insert(hash(0n))
    user1VoteOptionTree.insert(hash(0n))

    // Registers user 1
    stateTree.insert(multiHash([
      user1Pk[0], // public key x
      user1Pk[1], // public key y
      user1VoteOptionTree.root, // vote option tree root
      125n, // credit balance (100 is arbitrary for now)
      0n // nonce
    ]))

    const user1StateTreeIndex = stateTree.nextIndex - 1

    // Insert more random data as we just want to validate user 1
    stateTree.insert(multiHash([0n, randomPrivateKey()]))
    stateTree.insert(multiHash([1n, randomPrivateKey()]))

    // Construct user 1 command
    // Note: command is unencrypted, message is encrypted
    const user1Command = [
      BigInt(user1StateTreeIndex), // user index in state tree
      user1Pk[0], // Same public key
      user1Pk[1], // Same public key
      0n, // Vote option index (voting for candidate 0)
      5n, // sqrt of the number of voice credits user wishes to spend (spending 25 credit balance)
      1n, // Nonce
      randomPrivateKey() // Random salt
    ]

    // Sign and encrypt user message
    const user1Message = signAndEncrypt(
      user1Command,
      user1Sk,
      ephemeralSk,
      coordinatorPk
    )

    // Insert random data (as we just want to process 1 command)
    msgTree.insert(multiHash([0n, randomPrivateKey()]))
    msgTree.insert(multiHash([1n, randomPrivateKey()]))
    msgTree.insert(multiHash([2n, randomPrivateKey()]))
    msgTree.insert(multiHash([3n, randomPrivateKey()]))

    // Insert user 1 command into command tree
    msgTree.insert(multiHash(user1Message)) // Note its index 4
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

    // Random leaf is at index 0
    const [
      randomLeafPathElements,
      randomLeafPathIndexes
    ] = stateTree.getPathUpdate(0)

    const stateTreeMaxIndex = BigInt(stateTree.nextIndex - 1)

    const circuitInputs = {
      'coordinator_public_key': stringifyBigInts(coordinatorPk),
      'message': stringifyBigInts(user1Message),
      'msg_tree_root': stringifyBigInts(msgTree.root),
      'msg_tree_path_elements': stringifyBigInts(msgTreePathElements),
      'msg_tree_path_index': stringifyBigInts(msgTreePathIndexes),
      'state_tree_max_leaf_index': stringifyBigInts(stateTreeMaxIndex),
      'state_tree_root': stringifyBigInts(stateTree.root),
      'state_tree_path_elements': stringifyBigInts(stateTreePathElements),
      'state_tree_path_index': stringifyBigInts(stateTreePathIndexes),
      'random_leaf': stringifyBigInts(randomPrivateKey()),
      'random_leaf_path_elements': stringifyBigInts(randomLeafPathElements),
      'random_leaf_path_index': stringifyBigInts(randomLeafPathIndexes),
      'no_op': stringifyBigInts(0n),
      'ecdh_private_key': stringifyBigInts(
        babyJubJubPrivateKey(coordinatorSk)
      ),
      'ecdh_public_key': stringifyBigInts(ephemeralPk)
    }

    const witness = circuit.calculateWitness(circuitInputs)

    const idx = circuit.getSignalIdx('main.new_state_tree_root')
    console.log(user1Command[6])
    console.log(witness[idx].toString())
  } catch (e) {
    console.log(e)
  }
}

m()
