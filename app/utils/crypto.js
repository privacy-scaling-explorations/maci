// @flow

type MiMicSignature = {
  R8: Tuple<BigInt>,
  S: BigInt
};

const crypto = require('crypto')
const { babyJub, eddsa, mimc7 } = require('circomlib')

const randomBigInt = (): Buffer => {
  return Buffer.from(
    Array(64)
      .fill(0)
      .map((): Number => parseInt(Math.random()*10))
      .join(''),
    'hex'
  )
}

const serializeMsg = (msg: String): Array<Number> => {
  return msg.split('').map((x: String): Number => x.charCodeAt(0))
}

const deserializeMsg = (m: Array<Number>): String => {
  return m.map((x: Number): String => String.fromCharCode(x)).join('')
}

// Usage example

// Coordinator keys
const coordinatorPrivKey = Buffer.from('0001020304050607080900010203040506070809000102030405060708090001', 'hex')
const coordinatorPublicKey = eddsa.prv2pub(coordinatorPrivKey)

// User keys
const userPrivKey = Buffer.from('0001020304050607080900010203040506070809000102030405060708090002', 'hex')
const userPubKey = eddsa.prv2pub(userPrivKey)

// Calculate Shared key
// In order to encrypt and decrypt input
const edh = babyJub.mulPointEscalar(
  coordinatorPublicKey,
  BigInt(userPrivKey.toString('hex'))
)[0]
const edh2 = babyJub.mulPointEscalar(
  userPubKey,
  BigInt(coordinatorPrivKey.toString('hex'))
)[0]
console.log(edh)
console.log(edh2)
console.log(`EDH valid: ${edh === edh2}`)

// Original message
const msgJson = {
  msg: 'hello world',
  key: userPubKey.map((x: BigInt): String => x.toString())
}

const msgSerialized: Array<BigInt> = serializeMsg(JSON.stringify(msgJson))
  .map((x: Number): BigInt => BigInt(x))
const msgHash = mimc7.multiHash(msgSerialized)

// // Sign message
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
