//      

const { bigInt } = require('snarkjs')
const createBlakeHash = require('blake-hash')
const { babyJub, eddsa, mimc7 } = require('circomlib')

const randomPrivateKey = ()         => {
  return BigInt(
    Array(64)
      .fill(0)
      .map((x     )      => parseInt(Math.random()*10))
      .join('')
  ) % babyJub.subOrder
}

const privateToPublicKey = (sk        )                   => {
  return eddsa.prv2pub(bigInt2Buffer(sk))
}

const bigInt2Buffer = (i        )         => {
  return Buffer.from(i.toString())
}

const ecdh = (priv        , pub               )         => {
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
  msg               ,
  priv        ,
  pub               
)                => {
  // Encrypts a message
  const sharedKey = ecdh(priv, pub)
  const iv = mimc7.multiHash(msg, BigInt(0))
  return [
    iv, ...msg.map((e        , i        )         => {
      return e + mimc7.hash(sharedKey, iv + BigInt(i))
    })
  ]
}

const decrypt = (
  msg               ,
  priv        ,
  pub               
)                => {
  // Decrypts
  const sharedKey = ecdh(priv, pub)
  const iv = msg[0]
  return msg.slice(1).map((e        , i        )         => {
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
