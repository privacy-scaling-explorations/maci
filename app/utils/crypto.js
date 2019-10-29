// @flow

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

const privateToPublicKey = (sk: BigInt): [BigInt, BigInt] => {
  return eddsa.prv2pub(bigInt2Buffer(sk))
}

const bigInt2Buffer = (i: BigInt): Buffer => {
  return Buffer.from(i.toString())
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

module.exports = {
  randomPrivateKey,
  privateToPublicKey,
  ecdh,
  encrypt,
  decrypt
}
