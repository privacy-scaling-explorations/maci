// @flow

type MiMicSignature = {
  R8: Tuple<BigInt>,
  S: BigInt
};

const provingKey = require('../circuits/proving_key.json')
const verificationKey = require('../circuits/verification_key.json')
const circuitDef = require('../circuits/circuit.json')
const { Circuit, bigInt } = require('snarkjs')
const zkSnark = require('snarkjs').original
const { unstringifyBigInts } = require('snarkjs/src/stringifybigint')
const createBlakeHash = require('blake-hash')
const { babyJub, eddsa, mimc7 } = require('circomlib')

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

// User keys
const userPrivKey = randomPrivateKey()
const userPubKey = eddsa.prv2pub(
  bigInt2Buffer(userPrivKey)
)

const edh = ecdh(userPrivKey, coordinatorPublicKey)
const edh2 = ecdh(coordinatorPrivKey, userPubKey)

if (edh !== edh2) {
  console.log('Invalid shared keys')
  process.exit(1)
}

// Original message
const _msg = [
  userPubKey[0],
  userPubKey[1],
  0 // action
].map(num2bigInt)

// msg = [pubx, puby, action, new_pubx, new_puby, new_action]
const msg = [..._msg, ..._msg]

const msgHash = mimc7.multiHash(msg)

// Sign message
const signature: MiMicSignature = eddsa.signMiMC(
  userPrivKey.toString(),
  msgHash
)

// Insert signature into message
const m = [
  ...msg,
  signature.R8[0],
  signature.R8[1],
  signature.S
]

// Encrypt message
const encryptedMsg = encrypt(
  m, userPrivKey, coordinatorPublicKey
)

// Decrypt encrypted message
const decryptedMsg = decrypt(
  encryptedMsg, coordinatorPrivKey, userPubKey
)

// Check if signature valid
const decryptedMsgHash = mimc7.multiHash(decryptedMsg.slice(0, 3))
const decryptedSignature = {
  R8: [
    decryptedMsg[3],
    decryptedMsg[4]
  ],
  S: decryptedMsg[5]
}

const validSignature = eddsa.verifyMiMC(
  decryptedMsgHash,
  decryptedSignature,
  userPubKey
)

// Making sure params are generated valid
console.log(`Message length: ${m.length}`)
console.log(`EDH valid: ${edh === edh2}`)
console.log(`Valid Signature: ${validSignature}`)
console.log(`Message decrypted: ${JSON.stringify(decryptedMsg.map(bigInt2num)) === JSON.stringify(m.map(bigInt2num))}`)

// Ensuring inputs passes the circuits
const circuit = new Circuit(circuitDef)

const circuitInput = {
  encrypted_data: encryptedMsg,
  shared_private_key: edh,
  decrypted_data: decryptedMsg
}

console.log('Calculating witnesses....')
const witness = circuit.calculateWitness(circuitInput)

console.log('Generating proof....')
const { proof, publicSignals } = zkSnark.genProof(
  unstringifyBigInts(provingKey), witness
)

const isValid = zkSnark.isValid(
  unstringifyBigInts(verificationKey),
  proof,
  publicSignals
)

console.log(`Inputs passes circuit: ${isValid}`)
