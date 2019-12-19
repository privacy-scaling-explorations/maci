// @flow

const crypto = require('crypto')
const { bigInt } = require('snarkjs')
const { babyJub, eddsa, mimc7 } = require('circomlib')

const hash = (x: BigInt, k: BigInt): BigInt => {
  if (k === undefined) {
    return mimc7.hash(x, 91n)
  }

  return mimc7.hash(x, k)
}

const multiHash = (arr: Array<BigInt>): BigInt => {
  return mimc7.multiHash(arr, BigInt(0))
}

const randomPrivateKey = (): BigInt => {
  const SNARK_FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617')

  const min = ((BigInt(2) ** BigInt(256)) - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE

  let rand: BigInt

  while (true) {
    rand = BigInt('0x' + crypto.randomBytes(32).toString('hex'))

    if (rand >= min) {
      break
    }
  }

  return rand % SNARK_FIELD_SIZE
}

const bigInt2Buffer = (i: BigInt): Buffer => {
  return Buffer.from(i.toString())
}

const buffer2BigInt = (b: Buffer): BigInt => {
  return bigInt(parseInt(b.toString('hex'), 16))
}

const privateToPublicKey = (sk: BigInt): [BigInt, BigInt] => {
  const sBuff = eddsa.pruneBuffer(
    bigInt2Buffer(hash(sk))
      .slice(0, 32)
  )
  const s = bigInt.leBuff2int(sBuff).shr(3)

  return babyJub.mulPointEscalar(
    babyJub.Base8,
    s
  )
}

const ecdh = (priv: BigInt, pub: Tuple<BigInt>): BigInt => {
  const sBuff = eddsa.pruneBuffer(
    bigInt2Buffer(hash(priv))
      .slice(0, 32)
  )
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

const signMiMC = (prv: BigInt, msg: BigInt): { R8: BigInt, S: BigInt } => {
  const h1 = bigInt2Buffer(hash(prv))
  const sBuff = eddsa.pruneBuffer(h1.slice(0, 32))
  const s = bigInt.leBuff2int(sBuff)
  const A = babyJub.mulPointEscalar(babyJub.Base8, s.shr(3))

  const msgBuff = bigInt.leInt2Buff(msg, 32)

  const rBuff = bigInt2Buffer(hash(
    buffer2BigInt(Buffer.concat(
      [h1.slice(32, 64), msgBuff]
    ))
  ))
  let r = bigInt.leBuff2int(rBuff)
  r = r.mod(babyJub.subOrder)
  const R8 = babyJub.mulPointEscalar(babyJub.Base8, r)
  const hm = mimc7.multiHash([R8[0], R8[1], A[0], A[1], msg])
  const S = r.add(hm.mul(s)).mod(babyJub.subOrder)
  return {
    R8: R8,
    S: S
  }
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
  const signature = signMiMC(
    privSign,
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
  signMiMC,
  signAndEncrypt,
  verifyMiMC: eddsa.verifyMiMC,
  decryptAndVerify,
  hash,
  multiHash
}
