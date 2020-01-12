const path = require('path')
const compiler = require('circom')
const { assert } = require('chai')
const { stringifyBigInts, unstringifyBigInts } = require('../_build/utils/helpers')
const { Circuit, groth } = require('snarkjs')
const { buildBn128 } = require('websnark')
const { binarifyWitness, binarifyProvingKey } = require('../_build/utils/binarify')
const { merkleTreeConfig } = require('../maci-config')

const { maciContract } = require('../_build/utils/contracts')
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

const snarkScalarField = 21888242871839275222246405745257275088548364400416034343698204186575808495617n

const updateStateTreeProvingKey = require('../_build/circuits/update_state_tree_proving_key.json')
const updateStateTreeVerificationKey = require('../_build/circuits/update_tree_state_verifying_key.json')

describe('Update State Tree Ciruit', () => {
  const user1Sk = randomPrivateKey()
  const user1Pk = privateToPublicKey(user1Sk)

  const ephemeralSk = randomPrivateKey()
  const ephemeralPk = privateToPublicKey(ephemeralSk)

  const coordinatorSk = randomPrivateKey()
  const coordinatorPk = privateToPublicKey(coordinatorSk)

  const getUpdateStateTreeParams = async (userCmd, cmdSignOptions = {}) => {
    // Since there's not types here:
    // userCmd:
    /* [
      [0] - user index in state tree
      [1] - Same public key
      [2] - Same public key
      [3] - Vote option index (voting for candidate 0)
      [4] - sqrt of the number of voice credits user wishes to spend (spending 25 credit balance)
      [5] - Nonce
      [6] - Random salt
    ]
    */

    // Circuit definition
    const circuitDef = await compiler(path.join(__dirname, 'circuits', 'update_state_tree_test.circom'))
    const circuit = new Circuit(circuitDef)

    // Contruct the tree(s))
    const voteOptionTree = createMerkleTree(2, merkleTreeConfig.zeroValue)
    const msgTree = createMerkleTree(4, merkleTreeConfig.zeroValue)
    const stateTree = createMerkleTree(4, merkleTreeConfig.zeroValue)

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
    const user1VoteOptionTree = createMerkleTree(2, merkleTreeConfig.zeroValue)
    // insert first candidate with raw values
    user1VoteOptionTree.insert(hash(1n), 1n) // Assume we've already voted for candidate 1
    user1VoteOptionTree.insert(hash(0n))
    user1VoteOptionTree.insert(hash(0n))
    user1VoteOptionTree.insert(hash(0n))

    // Registers user 1
    const user1ExistingStateTreeData = [
      user1Pk[0], // public key x
      user1Pk[1], // public key y
      user1VoteOptionTree.root, // vote option tree root
      125n, // credit balance (100 is arbitrary for now)
      0n // nonce
    ]

    stateTree.insert(multiHash(user1ExistingStateTreeData))

    const user1StateTreeIndex = stateTree.nextIndex - 1

    // Insert more random data as we just want to validate user 1
    stateTree.insert(multiHash([0n, randomPrivateKey()]))
    stateTree.insert(multiHash([1n, randomPrivateKey()]))

    // Construct user 1 command
    // Note: command is unencrypted, message is encrypted
    const user1VoteOptionIndex = 0
    const user1Command = userCmd

    // Sign and encrypt user message
    const user1Message = signAndEncrypt(
      user1Command,
      cmdSignOptions.privateKey === undefined ? user1Sk : cmdSignOptions.privateKey,
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

    // Get the vote options tree path elements
    const [
      user1VoteOptionsPathElements,
      user1VoteOptionsPathIndexes
    ] = user1VoteOptionTree.getPathUpdate(user1VoteOptionIndex)

    const curVoteOptionTreeLeafRaw = user1VoteOptionTree.leavesRaw[user1VoteOptionIndex]

    const stateTreeMaxIndex = BigInt(stateTree.nextIndex - 1)

    const user1VoteOptionsTreeMaxIndex = BigInt(stateTree.nextIndex - 1)

    const circuitInputs = stringifyBigInts({
      'coordinator_public_key': coordinatorPk,
      'message': user1Message,
      'msg_tree_root': msgTree.root,
      'msg_tree_path_elements': msgTreePathElements,
      'msg_tree_path_index': msgTreePathIndexes,
      'vote_options_leaf_raw': curVoteOptionTreeLeafRaw,
      'vote_options_tree_root': user1VoteOptionTree.root,
      'vote_options_tree_path_elements': user1VoteOptionsPathElements,
      'vote_options_tree_path_index': user1VoteOptionsPathIndexes,
      'vote_options_max_leaf_index': user1VoteOptionsTreeMaxIndex,
      'state_tree_data_raw': user1ExistingStateTreeData,
      'state_tree_max_leaf_index': stateTreeMaxIndex,
      'state_tree_root': stateTree.root,
      'state_tree_path_elements': stateTreePathElements,
      'state_tree_path_index': stateTreePathIndexes,
      'ecdh_private_key': babyJubJubPrivateKey(coordinatorSk),
      'ecdh_public_key': ephemeralPk
    })

    return {
      circuit,
      circuitInputs,
      stateTree,
      msgTree,
      userVoteOptionTree: user1VoteOptionTree
    }
  }

  it('Valid Inputs', async () => {
    const user1StateTreeIndex = 1
    const user1VoteOptionIndex = 0
    const user1VoteOptionWeight = 5

    const user1Command = [
      BigInt(user1StateTreeIndex), // user index in state tree
      user1Pk[0], // Same public key
      user1Pk[1], // Same public key
      BigInt(user1VoteOptionIndex), // Vote option index (voting for candidate 0)
      BigInt(user1VoteOptionWeight), // sqrt of the number of voice credits user wishes to spend (spending 25 credit balance)
      1n, // Nonce
      randomPrivateKey() // Random salt
    ]

    const {
      circuit,
      circuitInputs,
      stateTree,
      userVoteOptionTree
    } = await getUpdateStateTreeParams(user1Command)

    // Get some variables
    const user1VoteOptionTree = userVoteOptionTree
    const curVoteOptionTreeLeafRaw = user1VoteOptionTree.leavesRaw[user1VoteOptionIndex]

    const witness = circuit.calculateWitness(circuitInputs)
    assert(circuit.checkWitness(witness))

    const idx = circuit.getSignalIdx('main.new_state_tree_root')
    const circuitNewStateRoot = witness[idx].toString()

    // Update user vote option tree
    // (It replaces the value)
    user1VoteOptionTree.update(
      user1VoteOptionIndex,
      hash(BigInt(user1VoteOptionWeight))
    )

    // Update state tree leaf (refer to user1Command)
    const newStateTreeLeaf = [
      user1Pk[0], // New private key x
      user1Pk[1], // New private key y
      user1VoteOptionTree.root, // User new vote option tree
      125n + BigInt(curVoteOptionTreeLeafRaw * curVoteOptionTreeLeafRaw) - BigInt(user1VoteOptionWeight * user1VoteOptionWeight), // Vote Balance
      1n // Nonce
    ]
    stateTree.update(
      user1StateTreeIndex,
      multiHash(newStateTreeLeaf)
    )

    const jsNewStateRoot = stateTree.root.toString()

    // Make sure js generated root and circuit root is similar
    assert.equal(circuitNewStateRoot, jsNewStateRoot)

    const wasmBn128 = await buildBn128()
    const zkSnark = groth

    const publicSignals = witness.slice(1, circuit.nPubInputs + circuit.nOutputs + 1)

    const witnessBin = binarifyWitness(witness)
    const updateStateTreeProvingKeyBin = binarifyProvingKey(updateStateTreeProvingKey)

    const proof = await wasmBn128.groth16GenProof(
      witnessBin,
      updateStateTreeProvingKeyBin
    )

    const isValid = zkSnark.isValid(
      unstringifyBigInts(updateStateTreeVerificationKey),
      unstringifyBigInts(proof),
      unstringifyBigInts(publicSignals)
    )
    assert.equal(isValid, true, 'Local Snark Proof is not valid!')

    const isValidOnChain = await maciContract.verifyUpdateStateTreeProof(
      stringifyBigInts(proof.pi_a).slice(0, 2),
      stringifyBigInts(proof.pi_b).map(x => x.reverse()).slice(0, 2),
      stringifyBigInts(proof.pi_c).slice(0, 2),
      stringifyBigInts(publicSignals.map(x => x % snarkScalarField))
    )

    assert.equal(isValidOnChain, true, 'Snark Proof failed on chain verification!')
  })

  it('Invalid Nonce', async () => {
    const user1StateTreeIndex = 1
    const user1VoteOptionIndex = 0
    const user1VoteOptionWeight = 5

    const user1Command = [
      BigInt(user1StateTreeIndex), // user index in state tree
      user1Pk[0], // Same public key
      user1Pk[1], // Same public key
      BigInt(user1VoteOptionIndex), // Vote option index (voting for candidate 0)
      BigInt(user1VoteOptionWeight), // sqrt of the number of voice credits user wishes to spend (spending 25 credit balance)
      0n, // Invalid Nonce (prev nonce was 0n)
      randomPrivateKey() // Random salt
    ]

    const {
      circuit,
      circuitInputs,
      stateTree
    } = await getUpdateStateTreeParams(user1Command)

    const witness = circuit.calculateWitness(circuitInputs)
    const idx = circuit.getSignalIdx('main.new_state_tree_root')
    const circuitNewStateRoot = witness[idx].toString()

    const jsNewStateRoot = stateTree.root.toString()

    // Make sure js generated root and circuit root is similar
    assert.equal(circuitNewStateRoot, jsNewStateRoot)
  })

  it('Invalid Signature', async () => {
    const user1StateTreeIndex = 1
    const user1VoteOptionIndex = 0
    const user1VoteOptionWeight = 5

    const user1Command = [
      BigInt(user1StateTreeIndex), // user index in state tree
      user1Pk[0], // Same public key
      user1Pk[1], // Same public key
      BigInt(user1VoteOptionIndex), // Vote option index (voting for candidate 0)
      BigInt(user1VoteOptionWeight), // sqrt of the number of voice credits user wishes to spend (spending 25 credit balance)
      0n, // Invalid Nonce (prev nonce was 0n)
      randomPrivateKey() // Random salt
    ]

    const {
      circuit,
      circuitInputs,
      stateTree
    } = await getUpdateStateTreeParams(user1Command, { privateKey: randomPrivateKey() })

    const witness = circuit.calculateWitness(circuitInputs)
    const idx = circuit.getSignalIdx('main.new_state_tree_root')
    const circuitNewStateRoot = witness[idx].toString()

    const jsNewStateRoot = stateTree.root.toString()

    assert.equal(circuitNewStateRoot, jsNewStateRoot)
  })

  it('Insufficient Voice Credits', async () => {
    const user1StateTreeIndex = 1
    const user1VoteOptionIndex = 0
    const user1VoteOptionWeight = 500000

    const user1Command = [
      BigInt(user1StateTreeIndex), // user index in state tree
      user1Pk[0], // Same public key
      user1Pk[1], // Same public key
      BigInt(user1VoteOptionIndex), // Vote option index (voting for candidate 0)
      BigInt(user1VoteOptionWeight), // sqrt of the number of voice credits user wishes to spend (spending 25 credit balance)
      0n, // Invalid Nonce (prev nonce was 0n)
      randomPrivateKey() // Random salt
    ]

    const {
      circuit,
      circuitInputs,
      stateTree
    } = await getUpdateStateTreeParams(user1Command)

    const witness = circuit.calculateWitness(circuitInputs)
    const idx = circuit.getSignalIdx('main.new_state_tree_root')
    const circuitNewStateRoot = witness[idx].toString()

    const jsNewStateRoot = stateTree.root.toString()

    // Make sure js generated root and circuit root is similar
    assert.equal(circuitNewStateRoot, jsNewStateRoot)
  })

  it('Invalid State Leaf Index', async () => {
    const user1StateTreeIndex = 999999999999
    const user1VoteOptionIndex = 0
    const user1VoteOptionWeight = 500000

    const user1Command = [
      BigInt(user1StateTreeIndex), // user index in state tree
      user1Pk[0], // Same public key
      user1Pk[1], // Same public key
      BigInt(user1VoteOptionIndex), // Vote option index (voting for candidate 0)
      BigInt(user1VoteOptionWeight), // sqrt of the number of voice credits user wishes to spend (spending 25 credit balance)
      0n, // Invalid Nonce (prev nonce was 0n)
      randomPrivateKey() // Random salt
    ]

    const {
      circuit,
      circuitInputs,
      stateTree
    } = await getUpdateStateTreeParams(user1Command)

    const witness = circuit.calculateWitness(circuitInputs)
    const idx = circuit.getSignalIdx('main.new_state_tree_root')
    const circuitNewStateRoot = witness[idx].toString()

    const jsNewStateRoot = stateTree.root.toString()

    // Make sure js generated root and circuit root is similar
    assert.equal(circuitNewStateRoot, jsNewStateRoot)
  })
})
