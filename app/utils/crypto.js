// @flow

const { babyJub, eddsa, mimc7 } = require('circomlib')

const rand256 = (): Number => {
  let n = 0n
  for (let i=0; i<9; i++) {
    const x = Math.floor(Math.random()*(1<<30))
    n = (n << 30n) + BigInt(x)
  }
  return n % (1n<<256n)
}

const serializeMsg = (msg: String): Array<Number> => {
  return msg.split('').map((x: String): Number => x.charCodeAt(0))
}

const deserializeMsg = (m: Array<Number>): String => {
  return m.map((x: Number): String => String.fromCharCode(x)).join('')
}

// Usage example

// Encrypting a value
const privKey = rand256()
const pubKey = babyJub.mulPointEscalar(babyJub.Base8, rand256() % babyJub.subOrder)
const edh = babyJub.mulPointEscalar(pubKey, privKey)[0]

const msg = serializeMsg('hello world')

const iv = mimc7.multiHash(msg.map((x: Number): BigInt => BigInt(x)), BigInt(0))
const encryptedMsg = msg.map((e: Number, i: Number): Array<Number> => {
  return BigInt(e) + mimc7.hash(edh, iv + BigInt(i))
})
const decryptedMsg: Array<Number> = encryptedMsg
  .map((e: BigInt, i: Number): BigInt => {
    return e - mimc7.hash(edh, iv + BigInt(i))
  })
  .map((x: BigInt): Number => {
    return Number(x)
  })

console.log(`Original Message: ${deserializeMsg(msg)}`)
console.log(`Decrypted Message: ${deserializeMsg(decryptedMsg)}`)

// console.log(`private key: ${privKey}`)
// console.log(`public key: ${pubKey}`)
// console.log(`edh: ${edh}`)
