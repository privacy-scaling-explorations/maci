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

const user2SecretKey = randomPrivateKey()
const user2PublicKey = privateToPublicKey(user2SecretKey)
const user2Message = [...user2PublicKey, 0n]
const user2EncryptedMsg = signAndEncrypt(
  user2Message,
  user2SecretKey,
  user2SecretKey,
  coordinatorPublicKey
)

const user3SecretKey = randomPrivateKey()
const user3PublicKey = privateToPublicKey(user3SecretKey)
const user3Message = [...user3PublicKey, 0n]
const user3EncryptedMsg = signAndEncrypt(
  user3Message,
  user3SecretKey,
  user3SecretKey,
  coordinatorPublicKey
)

// Insert users into the cmdTree and stateTree
cmdTree.insert(user1EncryptedMsg, user1PublicKey)
cmdTree.insert(user2EncryptedMsg, user2PublicKey)
cmdTree.insert(user3EncryptedMsg, user3PublicKey)

stateTree.insert(user1EncryptedMsg, user1PublicKey)
stateTree.insert(user2EncryptedMsg, user2PublicKey)
stateTree.insert(user3EncryptedMsg, user3PublicKey)

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

// Submits it to the smart contract
cmdTree.insert(user2NewEncryptedMsg, user2NewPublicKey)

// Construct circuit inputs
const [cmdTreePathElements, cmdTreePathIndex] = cmdTree.getPathUpdate(cmdTree.nextIndex - 1)

// 1st index because we're getting user 2
const [stateTreePathElements, stateTreePathIndex] = stateTree.getPathUpdate(1)

const oldEcdhPrivateKey = ecdh(
  user2SecretKey,
  coordinatorPublicKey
)

const newEcdhPrivateKey = ecdh(
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
  old_encrypted_data: stringifyBigInts(user2EncryptedMsg),
  new_encrypted_data: stringifyBigInts(user2NewEncryptedMsg),
  new_ecdh_private_key: stringifyBigInts(newEcdhPrivateKey),
  old_ecdh_private_key: stringifyBigInts(oldEcdhPrivateKey)
}

const witness = circuit.calculateWitness(circuitInput)

console.log('Calculated witness!')

const newRootIdx = circuit.getSignalIdx('main.new_state_tree_root')
const newRoot = witness[newRootIdx]

stateTree.update(1, user2NewEncryptedMsg, user2NewPublicKey)

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
