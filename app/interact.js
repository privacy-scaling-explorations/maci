// @flow

type MiMicSignature = {
    R8: Tuple<BigInt>,
    S: BigInt
  };

const { maciContract } = require('./utils/contracts')
const { randomPrivateKey, privateToPublicKey, encrypt } = require('./utils/crypto')
const { stringifyBigInts } = require('./utils/helpers')

const { eddsa, mimc7 } = require('circomlib')

const coordinatorPublicKey = [
  8402309255917934552493441178688540331230154087974620916960889785696677656809n,
  21664013129661822566009867745799196601970112708176800895956326644259790118534n
]

const userPrvKey = randomPrivateKey()
const userPubKey = privateToPublicKey(userPrvKey)

const userPosition: Array<BigInt> = [
  ...userPubKey,
  1n // Action
]

const userMessage = [
  ...userPosition,
  ...userPubKey,
  0n // New position
]

const userMessageHash = mimc7.multiHash(userMessage)

const signature: MiMicSignature = eddsa.signMiMC(
  userPrvKey.toString(),
  userMessageHash
)

// Insert signature into tx
const userFinalMessage = [
  ...userMessage,
  signature.R8[0],
  signature.R8[1],
  signature.S
]

const userEncryptedMessage = encrypt(
  userFinalMessage,
  userPrvKey,
  coordinatorPublicKey
)

const main = async () => {
  const msg = stringifyBigInts(userEncryptedMessage)
  const pk = stringifyBigInts(userPubKey)
  await maciContract.pubishMessage(msg, pk)
  console.log('Submitted!')
}

main()

// const { Circuit, bigInt, groth } = require('snarkjs')

// const provingKey = require('../circuits/proving_key.json')
// const verificationKey = require('../circuits/verification_key.json')
// const circuitDef = require('../circuits/circuit.json')

// const zkSnark = groth

// // Coordinator keys
// const coordinatorPrivKey = randomPrivateKey()
// const coordinatorPublicKey = eddsa.prv2pub(
//   bigInt2Buffer(coordinatorPrivKey)
// )

// // Alice
// const alicePrvKey = randomPrivateKey()
// const alicePubKey: Array<BigInt> = eddsa.prv2pub(
//   bigInt2Buffer(alicePrvKey)
// )

// const aliceEcdh = ecdh(
//   alicePrvKey,
//   coordinatorPublicKey
// )

// // Alice's current vote in the tree
// const alicePosition = [
//   ...alicePubKey,
//   1 // action
// ]

// const aliceHash = mimc7.multiHash(alicePosition)

// // Bob
// const bobPrvKey = randomPrivateKey()
// const bobPubKey: Array<BigInt> = eddsa.prv2pub(
//   bigInt2Buffer(bobPrvKey)
// )

// // Bob's current position in tree
// const bobPosition = [
//   ...bobPubKey,
//   0 // action
// ]

// const bobHash = mimc7.multiHash(bobPosition)

// // Calculate tree root
// // NOTE: Tree root is basically what has "happended"
// const merkletree = createMerkleTree(1, BigInt(0))
// merkletree.insert(aliceHash)
// merkletree.insert(bobHash)
// const treeRoot = merkletree.root

// // Alice's new transaction
// const aliceTx = [
//   ...alicePosition,
//   ...alicePubKey,
//   1 // Alice changed her vote to `1`
// ].map(x => BigInt(x))

// const aliceTxHash = mimc7.multiHash(aliceTx)

// // Sign message
// const signature: MiMicSignature = eddsa.signMiMC(
//   alicePrvKey.toString(),
//   aliceTxHash
// )

// // Insert signature into tx
// const aliceFinalTx = [
//   ...aliceTx,
//   signature.R8[0],
//   signature.R8[1],
//   signature.S
// ]

// // Encrypt message
// const aliceEncryptedTx = encrypt(
//   aliceFinalTx,
//   alicePrvKey,
//   coordinatorPublicKey
// )

// // Decrypt encrypted message
// const aliceDecryptedTx = decrypt(
//   aliceEncryptedTx, coordinatorPrivKey, alicePubKey
// )

// // Check if signature valid
// const decryptedTxHash = mimc7.multiHash(aliceDecryptedTx.slice(0, -3))
// const decryptedSignature = {
//   R8: [
//     aliceDecryptedTx.slice(-3)[0],
//     aliceDecryptedTx.slice(-3)[1]
//   ],
//   S: aliceDecryptedTx.slice(-3)[2]
// }

// const validSignature = eddsa.verifyMiMC(
//   decryptedTxHash,
//   decryptedSignature,
//   alicePubKey
// )

// Making sure params are generated valid
// console.log(`ECDH Pass check: ${ecdh(coordinatorPrivKey, alicePubKey) === aliceEcdh}`)
// console.log(`Valid Signature: ${validSignature}`)
// console.log(`Message decrypted: ${JSON.stringify(aliceDecryptedTx.map(bigInt2num)) === JSON.stringify(aliceFinalTx.map(bigInt2num))}`)

// // Ensuring inputs passes the circuits
// const circuit = new Circuit(circuitDef)

// // Calculate merkle tree params

// const aliceIndex = 0
// const [merkleTreePath, merkleTreePathPos] = merkletree.getPath(aliceIndex)
// const merkleTreePathPosFlipped = flipBits(merkleTreePathPos)

// const circuitInput = {
//   tree_root: treeRoot,
//   accounts_pubkeys: [alicePubKey, bobPubKey],
//   encrypted_data: aliceEncryptedTx,
//   shared_private_key: aliceEcdh,
//   decrypted_data: aliceDecryptedTx,
//   sender_proof: merkleTreePath,
//   sender_proof_pos: merkleTreePathPosFlipped
// }

// console.log('Calculating witnesses....')
// const witness = circuit.calculateWitness(circuitInput)

// console.log('Generating proof....')
// const { proof, publicSignals } = zkSnark.genProof(
//   unstringifyBigInts(provingKey), witness
// )

// console.log(JSON.stringify(stringifyBigInts(proof)))
// console.log(JSON.stringify(stringifyBigInts(publicSignals)))

// const isValid = zkSnark.isValid(
//   unstringifyBigInts(verificationKey),
//   proof,
//   publicSignals
// )

// console.log(`Inputs passes circuit: ${isValid}`)
