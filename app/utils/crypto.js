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

const serializeMsg = (msg: String): Array<Number> => {
  return msg.split('').map((x: String): Number => x.charCodeAt(0))
}

const deserializeMsg = (m: Array<Number>): String => {
  return m.map((x: Number): String => String.fromCharCode(x)).join('')
}

// Usage example

// Coordinator keys
const coordinatorPrivKey = randomPrivateKey()
const coordinatorPublicKey = eddsa.prv2pub(
  bigInt2Buffer(coordinatorPrivKey)
)
//  babyJub.mulPointEscalar(
//   babyJub.Base8,
//   coordinatorPrivKey
// )

// User keys
const userPrivKey = randomPrivateKey()
const userPubKey = eddsa.prv2pub(
  bigInt2Buffer(userPrivKey)
)
// babyJub.mulPointEscalar(
//   babyJub.Base8,
//   userPrivKey
// )

// Calculate Shared key
// In order to encrypt and decrypt input
const skTransformation = (priv: Buffer): BigInt => {
  const h1 = createBlakeHash('blake512').update(priv).digest()
  const sBuff = eddsa.pruneBuffer(h1.slice(0, 32))
  const s = bigInt.leBuff2int(sBuff).shr(3)
  return s
}

const edh = babyJub.mulPointEscalar(
  coordinatorPublicKey,
  skTransformation(bigInt2Buffer(userPrivKey))
)[0]

const edh2 = babyJub.mulPointEscalar(
  userPubKey,
  skTransformation(bigInt2Buffer(coordinatorPrivKey))
)[0]

console.log(`EDH valid: ${edh === edh2}`)

// Original message
const msgJson = {
  msg: 'hello world',
  key: userPubKey.map((x: BigInt): String => x.toString())
}

const msgSerialized: Array<BigInt> = serializeMsg(JSON.stringify(msgJson))
  .map((x: Number): BigInt => BigInt(x))
const msgHash = mimc7.multiHash(msgSerialized)

// Sign message
const msgSignatureObj: MiMicSignature = eddsa.signMiMC(
  userPrivKey.toString(),
  msgHash
)
const msgSignature = {
  R8: [
    msgSignatureObj.R8[0].toString(),
    msgSignatureObj.R8[1].toString()
  ],
  S: msgSignatureObj.S.toString()
}

const validSignature = eddsa.verifyMiMC(
  msgHash,
  msgSignatureObj,
  userPubKey
)

const msgWithSignature = Object.assign(
  msgJson, { signature: msgSignature }
)

const msg = JSON.stringify(msgWithSignature)

const m = serializeMsg(msg)

const iv = mimc7.multiHash(m.map((x: Number): BigInt => BigInt(x)), BigInt(0))

const encryptedMsg = m.map((e: Number, i: Number): Array<Number> => {
  return BigInt(e) + mimc7.hash(edh, iv + BigInt(i))
})
const decryptedMsg: Array<Number> = encryptedMsg
  .map((e: BigInt, i: Number): BigInt => {
    return e - mimc7.hash(edh, iv + BigInt(i))
  })
  .map((x: BigInt): Number => {
    return Number(x)
  })

console.log(`Valid Signature: ${validSignature}`)
console.log(`Decrypted Msg == Original Msg: ${deserializeMsg(m) === deserializeMsg(decryptedMsg)}`)
