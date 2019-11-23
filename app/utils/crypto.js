// @flow

const crypto = require('crypto')
const { bigInt } = require('snarkjs')
const createBlakeHash = require('blake-hash')
const { babyJub, eddsa, mimc7 } = require('circomlib')

const hash = (x: BigInt, k: BigInt): BigInt => {
  return mimc7.hash(x, k)
}

const multiHash = (arr: Array<BigInt>): BigInt => {
  return mimc7.multiHash(arr, BigInt(0))
}

const randomPrivateKey = (): BigInt => {
  return BigInt('0x' + crypto.randomBytes(32).toString('hex')) % babyJub.subOrder
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
  const iv = multiHash(msg, BigInt(0))
  return [
    iv, ...msg.map((e: BigInt, i: Number): BigInt => {
      return e + hash(sharedKey, iv + BigInt(i))
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
    return e - hash(sharedKey, iv + BigInt(i))
  })
}

const signAndEncrypt = (
  msg: Array<BigInt>,
  privSign: BigInt, // Private key to sign message
  privEcdh: BigInt, // Private key of ecdh
  pubEcdh: Tuple<BigInt> // Public key of ecdh
): Array<BigInt> => {
  // Get message hash
  const msgHash = multiHash(msg)

  // Sign message
  const signature = eddsa.signMiMC(
    privSign.toString(),
    msgHash
  )

  // Insert signature into message
  const msgWithSignature = [
    ...msg,
    signature.R8[0],
    signature.R8[1],
    signature.S
  ]

  // Encrypt message
  return encrypt(
    msgWithSignature,
    privEcdh,
    pubEcdh
  )
}

const decryptAndVerify = (
  encryptedMsg: Array<BigInt>,
  pubSign: Array<BigInt>, // Public key of signer
  privEcdh: Array<BigInt>,
  pubEcdh: Array<BigInt>
): Bool => {
  // Decrypt message
  const decryptedMsg = decrypt(
    encryptedMsg,
    privEcdh,
    pubEcdh
  )

  // Get original message (without the signatures)
  const originalMsg = decryptedMsg.slice(0, -3)
  const originalMsgHash = multiHash(originalMsg)

  // Validate signature
  const signature = {
    R8: [
      decryptedMsg.slice(-3)[0],
      decryptedMsg.slice(-3)[1]
    ],
    S: decryptedMsg.slice(-3)[2]
  }

  return eddsa.verifyMiMC(
    originalMsgHash,
    signature,
    pubSign
  )
}

module.exports = {
  randomPrivateKey,
  privateToPublicKey,
  ecdh,
  encrypt,
  decrypt,
  signAndEncrypt,
  decryptAndVerify,
  hash,
  multiHash
}
