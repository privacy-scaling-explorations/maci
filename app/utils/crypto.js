// @flow

type MiMicSignature = {
  R8: Tuple<BigInt>,
  S: BigInt
};

const { babyJub, eddsa, mimc7 } = require('circomlib')

const rand256 = (): Number => {
  let n = 0n
  for (let i=0; i<9; i++) {
    const x = Math.floor(Math.random()*(1<<30))
    n = (n << 30n) + BigInt(x)
  }
  return n % (1n<<256n)
}

const stringifyBigInts = (o: BigInt): String => {
  if ((typeof o === 'bigint') || (o instanceof BigInt)) {
    return o.toString(10)
  } else if (Array.isArray(o)) {
    return o.map(stringifyBigInts)
  } else if (typeof o === 'object') {
    const res = {}
    for (const k in o) {
      res[k] = stringifyBigInts(o[k])
    }
    return res
  } else {
    return o
  }
}

const unstringifyBigInts = (o: String): BigInt => {
  if ((typeof (o) === 'string') && (/^[0-9]+$/.test(o))) {
    return BigInt(o)
  } else if (Array.isArray(o)) {
    return o.map(unstringifyBigInts)
  } else if (typeof o === 'object') {
    const res = {}
    for (const k in o) {
      res[k] = unstringifyBigInts(o[k])
    }
    return res
  } else {
    return o
  }
}

const serializeMsg = (msg: String): Array<Number> => {
  return msg.split('').map((x: String): Number => x.charCodeAt(0))
}

const deserializeMsg = (m: Array<Number>): String => {
  return m.map((x: Number): String => String.fromCharCode(x)).join('')
}

// Usage example

// Coordinator keys
const coordinatorPrivKey = rand256()
const coordinatorPublicKey = babyJub.mulPointEscalar(
  babyJub.Base8,
  coordinatorPrivKey % babyJub.subOrder
)

// User keys
const userPrivKey = rand256()
const userPubKey = babyJub.mulPointEscalar(
  babyJub.Base8,
  userPrivKey % babyJub.subOrder
)

const msgJson = {
  msg: 'hello world',
  key: userPubKey.map((x: BigInt): String => x.toString())
}

const msgSerialized: Array<BigInt> = serializeMsg(JSON.stringify(msgJson))
  .map((x: Number): BigInt => BigInt(x))
const msgHash = mimc7.multiHash(msgSerialized)

// Shared key
const edh = babyJub.mulPointEscalar(coordinatorPublicKey, userPrivKey)[0]

const msgSignatureObj: MiMicSignature = eddsa.signMiMC(
  Buffer.from(edh.toString(16).padStart(64, '0'), 'hex'),
  msgHash
)
const msgSignature = {
  R8: [
    msgSignatureObj.R8[0].toString(),
    msgSignatureObj.R8[1].toString()
  ],
  S: msgSignatureObj.S.toString()
}

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

console.log(`Original Message: ${deserializeMsg(m)}`)
console.log(`Decrypted Message: ${deserializeMsg(decryptedMsg)}`)

// console.log(`private key: ${privKey}`)
// console.log(`public key: ${pubKey}`)
// console.log(`edh: ${edh}`)
