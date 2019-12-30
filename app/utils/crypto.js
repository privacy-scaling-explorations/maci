// @flow

const crypto = require('crypto')
const { bigInt } = require('snarkjs')
const { babyJub, eddsa, mimcsponge } = require('circomlib')

const bigInt2Buffer = (i: BigInt): Buffer => {
  return Buffer.from(i.toString())
}

const buffer2BigInt = (b: Buffer): BigInt => {
  return bigInt(parseInt(b.toString('hex'), 16))
}
const hash = (msg: BigInt, k: BigInt): BigInt => {
  if (k === undefined) {
    return multiHash([msg], 0n, 1)
  }

  return multiHash([msg], k, 1)
}

const hashLeftRight = (left: BigInt, right: BigInt): BigInt => {
  return bigInt(multiHash([bigInt(left), bigInt(right)]))
}

const multiHash = (arr: Array<BigInt>, key: ?BigInt, outputs: ?number): BigInt => {
  const ret = mimcsponge.multiHash(arr, key, outputs)

  if (Array.isArray(ret)) {
    return ret.map((x: Any): BigInt => bigInt(x))
  }

  return bigInt(ret)
}

const babyJubJubPrivateKey = (priv: BigInt): BigInt => {
  // Formats private key to be babyJubJub compatiable

  // https://tools.ietf.org/html/rfc8032
  // Because of the "buff[0] & 0xF8" part which makes sure you have a point with order that 8 divides
  // (^ pruneBuffer)
  // Every point in babyjubjub is of the form: aP + bH, where H has order 8 and P has a big large prime order
  // Guaranteeing that any low order points in babyjubjub get deleted
  // ^From Kobi
  const sBuff = eddsa.pruneBuffer(
    bigInt2Buffer(hash(priv))
      .slice(0, 32)
  )

  return bigInt.leBuff2int(sBuff).shr(3)
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

const privateToPublicKey = (sk: BigInt): [BigInt, BigInt] => {
  const s = babyJubJubPrivateKey(sk)

  return babyJub.mulPointEscalar(
    babyJub.Base8,
    s
  )
}

const ecdh = (priv: BigInt, pub: Tuple<BigInt>): BigInt => {
  const s = babyJubJubPrivateKey(priv)

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
  const iv = multiHash(msg)
  return [
    iv, ...msg.map((e: BigInt, i: Number): BigInt => {
      return e + hash(sharedKey, iv + bigInt(i))
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
    return e - hash(sharedKey, iv + bigInt(i))
  })
}

const sign = (prv: BigInt, _msg: BigInt): { R8: BigInt, S: BigInt } => {
  // Doing this as bigInt2Buffer requires a custom
  // methods 'greater' than isn't in the standard bigint
  // object (its a snarkjs custom bigint obj method)
  const msg = bigInt(_msg)

  const h1 = bigInt2Buffer(hash(prv))
  const sBuff = eddsa.pruneBuffer(h1.slice(0, 32))
  const s = bigInt.leBuff2int(sBuff)
  const A = babyJub.mulPointEscalar(babyJub.Base8, s.shr(3))

  const msgBuff = bigInt.leInt2Buff(
    msg,
    32
  )

  const rBuff = bigInt2Buffer(hash(
    buffer2BigInt(Buffer.concat(
      [h1.slice(32, 64), msgBuff]
    ))
  ))
  let r = bigInt.leBuff2int(rBuff)
  r = r.mod(babyJub.subOrder)
  const R8 = babyJub.mulPointEscalar(babyJub.Base8, r)
  const hm = multiHash([R8[0], R8[1], A[0], A[1], msg])
  const S = r.add(hm.mul(s)).mod(babyJub.subOrder)
  return {
    R8: R8,
    S: S
  }
}

const verify = (
  msg: Array<BigInt>,
  sig: { R8: BigInt, S: BigInt },
  pubKey: Array<BigInt>
): Boolean => {
  return eddsa.verifyMiMCSponge(msg, sig, pubKey)
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
  const signature = sign(
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

  return verify(
    originalMsgHash,
    signature,
    pubSign
  )
}

module.exports = {
  babyJubJubPrivateKey,
  randomPrivateKey,
  privateToPublicKey,
  ecdh,
  encrypt,
  decrypt,
  sign,
  signAndEncrypt,
  verify,
  decryptAndVerify,
  hash,
  hashLeftRight,
  multiHash
}
