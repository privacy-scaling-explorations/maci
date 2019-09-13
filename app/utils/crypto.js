// @flow

type MiMicSignature = {
  R8: Tuple<BigInt>,
  S: BigInt
};

const { bigInt } = require('snarkjs')
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
  // (similar to how eddsa.prv2pub does it)
  const h1 = createBlakeHash('blake512').update(privBuff).digest()
  const sBuff = eddsa.pruneBuffer(h1.slice(0, 32))
  const s = bigInt.leBuff2int(sBuff).shr(3)

  return babyJub.mulPointEscalar(
    pub,
    s
  )[0]
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

// Original message
const msg = [
  0, // Action
  userPubKey[0],
  userPubKey[1]
].map(num2bigInt)

const msgHash = mimc7.multiHash(msg)

// Sign message
const signature: MiMicSignature = eddsa.signMiMC(
  userPrivKey.toString(),
  msgHash
)

// Insert signature into message
const m = [
  msg[0],
  msg[1],
  msg[2],
  signature.R8[0],
  signature.R8[1],
  signature.S
]

// Shared property
const iv = mimc7.multiHash(m.map((x: Number): BigInt => BigInt(x)), BigInt(0))

// Encrypt message
const encryptedMsg = m.map((e: Number, i: Number): Array<Number> => {
  return BigInt(e) + mimc7.hash(edh, iv + BigInt(i))
})

// Decrypt encrypted message
const decryptedMsg: Array<BigInt> = encryptedMsg
  .map((e: BigInt, i: Number): BigInt => {
    return e - mimc7.hash(edh, iv + BigInt(i))
  })

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

console.log(`Message length: ${m.length}`)
console.log(`EDH valid: ${edh === edh2}`)
console.log(`Valid Signature: ${validSignature}`)
console.log(`Message decrypted: ${JSON.stringify(decryptedMsg.map(bigInt2num)) === JSON.stringify(m.map(bigInt2num))}`)
