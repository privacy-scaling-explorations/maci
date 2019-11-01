const { createMerkleTree } = require('./utils/merkletree')
const { stringifyBigInts, unstringifyBigInts } = require('./utils/helpers')
const { randomPrivateKey, privateToPublicKey, signAndEncrypt, ecdh } = require('./utils/crypto')

const provingKey = require('./circuits/proving_key.json')
const verificationKey = require('./circuits/verification_key.json')
const circuitDef = require('./circuits/circuit.json')

const { Circuit, groth } = require('snarkjs')
// const { mimc7 } = require('circomlib')

const zkSnark = groth

// Command and State Tree
const cmdTree = createMerkleTree(4, 0n)
const stateTree = createMerkleTree(4, 0n)

// Coordinator keys
const coordinatorSecretKey = randomPrivateKey()
const coordinatorPublicKey = privateToPublicKey(coordinatorSecretKey)

// Create 3 users (for registration)
const user1SecretKey = randomPrivateKey()
const user1PublicKey = privateToPublicKey(user1SecretKey)
const user1Message = [...user1PublicKey, 0n]
const user1EncryptedMsg = signAndEncrypt(
  user1Message,
  user1SecretKey,
  user1SecretKey,
  coordinatorPublicKey
)
const user1Leaf = cmdTree.hash(user1EncryptedMsg)

const user2SecretKey = randomPrivateKey()
const user2PublicKey = privateToPublicKey(user2SecretKey)
const user2Message = [...user2PublicKey, 0n]
const user2EncryptedMsg = signAndEncrypt(
  user2Message,
  user2SecretKey,
  user2SecretKey,
  coordinatorPublicKey
)
const user2Leaf = cmdTree.hash(user2EncryptedMsg)

const user3SecretKey = randomPrivateKey()
const user3PublicKey = privateToPublicKey(user3SecretKey)
const user3Message = [...user3PublicKey, 0n]
const user3EncryptedMsg = signAndEncrypt(
  user3Message,
  user3SecretKey,
  user3SecretKey,
  coordinatorPublicKey
)
const user3Leaf = cmdTree.hash(user3EncryptedMsg)

// Insert users into the cmdTree and stateTree
cmdTree.insert(user1Leaf)
cmdTree.insert(user2Leaf)
cmdTree.insert(user3Leaf)

// Only the stateTree saves the raw values
stateTree.insert(user1Leaf, user1Message)
stateTree.insert(user2Leaf, user2Message)
stateTree.insert(user3Leaf, user3Message)

// User 2 wants to choose their vote and change public key
const user2NewSecretKey = randomPrivateKey()
const user2NewPublicKey = privateToPublicKey(user2NewSecretKey)
const user2NewMessage = [...user2NewPublicKey, 1n]
const user2NewEncryptedMsg = signAndEncrypt(
  user2NewMessage,
  user2SecretKey, // Using old secret key to sign tx as thats what the circuit is validating against
  user2NewSecretKey,
  coordinatorPublicKey
)
const user2NewLeaf = cmdTree.hash(user2NewEncryptedMsg)

// Submits it to the smart contract
cmdTree.insert(user2NewLeaf, user2NewMessage)

// Construct circuit inputs
const [cmdTreePathElements, cmdTreePathIndex] = cmdTree.getPathUpdate(cmdTree.nextIndex - 1)

// 1st index because we're getting user 2
const [stateTreePathElements, stateTreePathIndex] = stateTree.getPathUpdate(1)

const ecdhPrivateKey = ecdh(
  user2NewSecretKey,
  coordinatorPublicKey
)

// const validSignature = decryptAndVerify(
//   user2EncryptedMsg,
//   user2PublicKey,
//   user2SecretKey,
//   coordinatorPublicKey
// )

const circuit = new Circuit(circuitDef)
const circuitInput = {
  cmd_tree_root: stringifyBigInts(cmdTree.root),
  cmd_tree_path_elements: stringifyBigInts(cmdTreePathElements),
  cmd_tree_path_index: stringifyBigInts(cmdTreePathIndex),
  state_tree_root: stringifyBigInts(stateTree.root),
  state_tree_path_elements: stringifyBigInts(stateTreePathElements),
  state_tree_path_index: stringifyBigInts(stateTreePathIndex),
  encrypted_data: stringifyBigInts(user2NewEncryptedMsg),
  existing_public_key: stringifyBigInts(user2PublicKey),
  existing_state_tree_leaf: stringifyBigInts(user2Leaf),
  ecdh_private_key: stringifyBigInts(ecdhPrivateKey)
}

const witness = circuit.calculateWitness(circuitInput)

console.log('Calculated witness!')

const newRootIdx = circuit.getSignalIdx('main.new_state_tree_root')
const newRoot = witness[newRootIdx]

stateTree.update(1, user2NewLeaf, user2NewMessage)

console.log(`Local new_state_tree_root: ${stateTree.root.toString()}`)
console.log(`Snark new_state_tree_root: ${newRoot}`)

const { proof, publicSignals } = zkSnark.genProof(
  unstringifyBigInts(provingKey), witness
)

const isValid = zkSnark.isValid(
  unstringifyBigInts(verificationKey),
  proof,
  publicSignals
)

console.log(`merkletree valid: ${isValid}`)
console.log(publicSignals)
