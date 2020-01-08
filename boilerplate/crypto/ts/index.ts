import * as assert from 'assert'
import * as crypto from 'crypto'
import * as snarkjs from 'snarkjs'
import { babyJub, eddsa, mimcsponge } from 'circomlib'

import {
    SnarkBigInt,
} from 'libsemaphore'

type MaciPrivKey = SnarkBigInt
type MaciPubKey = SnarkBigInt[]
type MaciEcdhSharedKey = SnarkBigInt
type Ciphertext = SnarkBigInt[]
type Plaintext = SnarkBigInt[]
interface Signature {
    R8: SnarkBigInt[],
    S: SnarkBigInt,
}

const SNARK_FIELD_SIZE = snarkjs.bigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
)

const bigInt2Buffer = (i: SnarkBigInt): Buffer => {
  return Buffer.from(i.toString(16))
}

const buffer2BigInt = (b: Buffer): BigInt => {
  return snarkjs.bigInt('0x' + b.toString('hex'))
}

const multiHash = (
    arr: SnarkBigInt[], 
    key?: SnarkBigInt,
    outputs?: number
): SnarkBigInt => {
  const ret = mimcsponge.multiHash(arr, key, outputs)

  if (Array.isArray(ret)) {
    return ret.map((x: any): SnarkBigInt => snarkjs.bigInt(x))
  }

  return snarkjs.bigInt(ret)
}

/*
 * @return A BabyJub-compatible private key.
 * We create it by first generating a random value (initially 256 bits large)
 * modulo the snark field size as described in EIP197. This results in a key
 * size of roughly 253 bits and no more than 254 bits. To prevent modulo bias,
 * we use this efficient algorithm:
 * http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c
 * Next, we use a 'prune buffer' technique (TODO: clarify this) to format it to
 * be compatible with BabyJubJub.
 */
const genPrivKey: MaciPrivKey = () => {

    assert(SNARK_FIELD_SIZE.eq(snarkjs.bn128.r))

    // This algorithm prevents modulo bias
    const min = (
        (snarkjs.bigInt(2).pow(snarkjs.bigInt(256))) - SNARK_FIELD_SIZE
    ) % SNARK_FIELD_SIZE

    let rand: SnarkBigInt

    while (true) {
        rand = snarkjs.bigInt('0x' + crypto.randomBytes(32).toString('hex'))

        if (rand >= min) {
            break
        }
    }

    const unformatted = rand % SNARK_FIELD_SIZE
    assert(unformatted < SNARK_FIELD_SIZE)

    // TODO: clarify this explanation
    // https://tools.ietf.org/html/rfc8032
    // Because of the "buff[0] & 0xF8" part which makes sure you have a point
    // with order that 8 divides (^ pruneBuffer)
    // Every point in babyjubjub is of the form: aP + bH, where H has order 8
    // and P has a big large prime order
    // Guaranteeing that any low order points in babyjubjub get deleted
    const sBuff = eddsa.pruneBuffer(
        bigInt2Buffer(
            mimcsponge.multiHash([unformatted], 0, 1)
        ).slice(0, 32)
    )

  return snarkjs.bigInt.leBuff2int(sBuff).shr(3)
}

/*
 * @param privKey A private key generated using genPrivKey()
 * @return A public key associated with the private key
 */
const genPubKey = (privKey: MaciPrivKey): MaciPubKey => {
    // Check whether privKey is a field element
    assert(privKey < SNARK_FIELD_SIZE)

    // TODO: check whether privKey is valid (i.e. that the prune buffer step
    // worked)

    const pubKey = babyJub.mulPointEscalar(babyJub.Base8, privKey)

    // TODO: assert that pubKey is valid
    // TODO: figure out how to check if pubKey is valid

    return pubKey
}

const genEcdhSharedKey = (
    privKey: MaciPrivKey,
    pubKey: MaciPubKey,
): MaciEcdhSharedKey => {

    return babyJub.mulPointEscalar(pubKey, privKey)[0]
}

const encrypt = (
    plaintext: Plaintext,
    sharedKey: MaciEcdhSharedKey,
): Ciphertext => {

    // Generate the IV
    const iv = mimcsponge.multiHash(plaintext, 0, 1)

    // The ciphertext is an array where the 0th element is the IV, and each
    // subsequent element is the MiMCSponge encryption of an element in the
    // plaintext
    const ciphertext = [
        iv, 
        ...plaintext.map((e: SnarkBigInt, i: Number): SnarkBigInt => {
            return e + mimcsponge.multiHash(
                [sharedKey], 
                iv + snarkjs.bigInt(i),
                1,
            )
        })
    ]

    // TODO: add asserts here
    return ciphertext
}

const decrypt = (
    ciphertext: Ciphertext,
    sharedKey: MaciEcdhSharedKey,
): Plaintext => {

    const iv = ciphertext[0]
    return ciphertext.slice(1).map((e: SnarkBigInt, i: Number): SnarkBigInt => {
        return e - mimcsponge.multiHash(
            [sharedKey],
            iv + snarkjs.bigInt(i),
            1,
        )
    })
}

const sign = (
    privKey: MaciPrivKey,
    message: SnarkBigInt,
): Signature => {
    const h1 = bigInt2Buffer(
        mimcsponge.multiHash([privKey], 0, 1)
    )

    const sBuff = eddsa.pruneBuffer(h1.slice(0, 32))
    const s = snarkjs.bigInt.leBuff2int(sBuff)
    const A = babyJub.mulPointEscalar(babyJub.Base8, s.shr(3))

    const msgBuff = snarkjs.bigInt.leInt2Buff(
        message,
        32
    )

    const rBuff = bigInt2Buffer(
        mimcsponge.multiHash([
            buffer2BigInt(Buffer.concat(
                [h1.slice(32, 64), msgBuff]
            ))
        ], 0, 1)
    )
    let r = snarkjs.bigInt.leBuff2int(rBuff)
    r = r.mod(babyJub.subOrder)
    const R8 = babyJub.mulPointEscalar(babyJub.Base8, r)
    const hm = mimcsponge.multiHash([R8[0], R8[1], A[0], A[1], message], 0, 1)
    const S = r.add(hm.mul(s)).mod(babyJub.subOrder)

    return {
        R8: R8,
        S: S
    }
}

export {
    genPrivKey,
    genPubKey,
    genEcdhSharedKey,
    encrypt,
    decrypt,
    sign,
    MaciPrivKey,
    MaciPubKey,
    MaciEcdhSharedKey,
    Ciphertext,
}
