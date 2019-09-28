// @flow

type MiMicSignature = {
  R8: Tuple<BigInt>,
  S: BigInt
};

const { flipBits } = require('./helpers')
const { createMerkleTree } = require('./merkletree')
const { stringifyBigInts, unstringifyBigInts } = require('snarkjs/src/stringifybigint')
const { Circuit, bigInt, groth } = require('snarkjs')
const createBlakeHash = require('blake-hash')
const { babyJub, eddsa, mimc7 } = require('circomlib')

const provingKey = require('../circuits/proving_key.json')
const verificationKey = require('../circuits/verification_key.json')
const circuitDef = require('../circuits/circuit.json')

const zkSnark = groth

const randomPrivateKey = (): BigInt => {
  return BigInt(
    Array(64)
      .fill(0)
      .map((x: Any): Int => parseInt(Math.random()*10))
      .join('')
  ) % babyJub.subOrder
}

const bigInt2Buffer = (i: BigInt): Buffer => {
  return Buffer.from(i.toString())
}

const num2bigInt = (n: Number): BigInt => {
  return BigInt(n)
}

const bigInt2num = (i: BigInt): Number => {
  return Number(i)
}

const ecdh = (priv: BigInt, pub: Tuple<BigInt>): BigInt => {
  const privBuff = bigInt2Buffer(priv)

  // Prepare private key xformation
  // (similar to how eddsa.prv2pub prepares
  // the private key)
  const h1 = createBlakeHash('blake512').update(privBuff).digest()
  const sBuff = eddsa.pruneBuffer(h1.slice(0, 32))
  const s = bigInt.leBuff2int(sBuff).shr(3)

  return babyJub.mulPointEscalar(
    pub,
    s
  )[0]
}

const encrypt = (
  msg: Array<BigInt>,
  priv: BigInt,
  pub: Tuple<BigInt>
): Array<BigInt> => {
  // Encrypts a message
  const sharedKey = ecdh(priv, pub)
  const iv = mimc7.multiHash(msg, BigInt(0))
  return [
    iv, ...msg.map((e: BigInt, i: Number): BigInt => {
      return e + mimc7.hash(sharedKey, iv + BigInt(i))
    })
  ]
}

const decrypt = (
  msg: Array<BigInt>,
  priv: BigInt,
  pub: Tuple<BigInt>
): Array<BigInt> => {
  // Decrypts
  const sharedKey = ecdh(priv, pub)
  const iv = msg[0]
  return msg.slice(1).map((e: BigInt, i: Number): BigInt => {
    return e - mimc7.hash(sharedKey, iv + BigInt(i))
  })
}

// Usage example

// Coordinator keys
const coordinatorPrivKey = randomPrivateKey()
const coordinatorPublicKey = eddsa.prv2pub(
  bigInt2Buffer(coordinatorPrivKey)
)

// Alice
const alicePrvKey = randomPrivateKey()
const alicePubKey: Array<BigInt> = eddsa.prv2pub(
  bigInt2Buffer(alicePrvKey)
)

const aliceEcdh = ecdh(
  alicePrvKey,
  coordinatorPublicKey
)

// Alice's current vote in the tree
const alicePosition = [
  ...alicePubKey,
  1 // action
]

const aliceHash = mimc7.multiHash(alicePosition)

// Bob
const bobPrvKey = randomPrivateKey()
const bobPubKey: Array<BigInt> = eddsa.prv2pub(
  bigInt2Buffer(bobPrvKey)
)

// Bob's current position in tree
const bobPosition = [
  ...bobPubKey,
  0 // action
]

const bobHash = mimc7.multiHash(bobPosition)

// Calculate tree root
// NOTE: Tree root is basically what has "happended"
const merkletree = createMerkleTree(1, BigInt(0))
merkletree.insert(aliceHash)
merkletree.insert(bobHash)
const treeRoot = merkletree.root

// Alice's new transaction
const aliceTx = [
  ...alicePosition,
  ...alicePubKey,
  1 // Alice changed her vote to `1`
].map(num2bigInt)

const aliceTxHash = mimc7.multiHash(aliceTx)

// Sign message
const signature: MiMicSignature = eddsa.signMiMC(
  alicePrvKey.toString(),
  aliceTxHash
)

// Insert signature into tx
const aliceFinalTx = [
  ...aliceTx,
  signature.R8[0],
  signature.R8[1],
  signature.S
]

// Encrypt message
const aliceEncryptedTx = encrypt(
  aliceFinalTx,
  alicePrvKey,
  coordinatorPublicKey
)

// Decrypt encrypted message
const aliceDecryptedTx = decrypt(
  aliceEncryptedTx, coordinatorPrivKey, alicePubKey
)

// Check if signature valid
const decryptedTxHash = mimc7.multiHash(aliceDecryptedTx.slice(0, -3))
const decryptedSignature = {
  R8: [
    aliceDecryptedTx.slice(-3)[0],
    aliceDecryptedTx.slice(-3)[1]
  ],
  S: aliceDecryptedTx.slice(-3)[2]
}

const validSignature = eddsa.verifyMiMC(
  decryptedTxHash,
  decryptedSignature,
  alicePubKey
)

// Making sure params are generated valid
console.log(`ECDH Pass check: ${ecdh(coordinatorPrivKey, alicePubKey) === aliceEcdh}`)
console.log(`Valid Signature: ${validSignature}`)
console.log(`Message decrypted: ${JSON.stringify(aliceDecryptedTx.map(bigInt2num)) === JSON.stringify(aliceFinalTx.map(bigInt2num))}`)

// Ensuring inputs passes the circuits
const circuit = new Circuit(circuitDef)

// Calculate merkle tree params

const aliceIndex = 0
const [merkleTreePath, merkleTreePathPos] = merkletree.getPath(aliceIndex)
const merkleTreePathPosFlipped = flipBits(merkleTreePathPos)

const circuitInput = {
  tree_root: treeRoot,
  accounts_pubkeys: [alicePubKey, bobPubKey],
  encrypted_data: aliceEncryptedTx,
  shared_private_key: aliceEcdh,
  decrypted_data: aliceDecryptedTx,
  sender_proof: merkleTreePath,
  sender_proof_pos: merkleTreePathPosFlipped
}

console.log('Calculating witnesses....')
const witness = circuit.calculateWitness(circuitInput)

console.log('Generating proof....')
const { proof, publicSignals } = zkSnark.genProof(
  unstringifyBigInts(provingKey), witness
)

console.log(JSON.stringify(stringifyBigInts(proof)))
console.log(JSON.stringify(stringifyBigInts(publicSignals)))

const isValid = zkSnark.isValid(
  unstringifyBigInts(verificationKey),
  proof,
  publicSignals
)

console.log(`Inputs passes circuit: ${isValid}`)
