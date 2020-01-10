import * as assert from 'assert'
import * as crypto from 'crypto'
import * as snarkjs from 'snarkjs'
import { babyJub, eddsa, mimcsponge } from 'circomlib'

import {
    SnarkBigInt,
} from 'libsemaphore'

type PrivKey = SnarkBigInt
type PubKey = SnarkBigInt[]
type EcdhSharedKey = SnarkBigInt
type Plaintext = SnarkBigInt[]

interface Ciphertext {
    iv: SnarkBigInt,
    data: SnarkBigInt[],
}

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

/*
 * A convenience function for a few functions which use mimcsponge to hash one
 * value with key 0 and require only 1 output
 */
const mimcspongeHashOne = (preImage: SnarkBigInt): SnarkBigInt => {
    return mimcsponge.multiHash([preImage], 0, 1)
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
const genPrivKey: PrivKey = () => {

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

    const privKey = rand % SNARK_FIELD_SIZE
    assert(privKey < SNARK_FIELD_SIZE)

    return privKey
}

/*
 * An internal function which formats a random private key to be compatible
 * with the BabyJub curve.
 */
const formatPrivKeyForBabyJub = (privKey: PrivKey) => {

    // TODO: clarify this explanation
    // https://tools.ietf.org/html/rfc8032
    // Because of the "buff[0] & 0xF8" part which makes sure you have a point
    // with order that 8 divides (^ pruneBuffer)
    // Every point in babyjubjub is of the form: aP + bH, where H has order 8
    // and P has a big large prime order
    // Guaranteeing that any low order points in babyjubjub get deleted
    const sBuff = eddsa.pruneBuffer(
        bigInt2Buffer(
            mimcspongeHashOne(privKey)
        ).slice(0, 32)
    )

    return snarkjs.bigInt.leBuff2int(sBuff).shr(3)
}

/*
 * @param privKey A private key generated using genPrivKey()
 * @return A public key associated with the private key
 */
const genPubKey = (privKey: PrivKey): PubKey => {
    // Check whether privKey is a field element
    assert(privKey < SNARK_FIELD_SIZE)

    // TODO: check whether privKey is valid (i.e. that the prune buffer step
    // worked)

    const pubKey = babyJub.mulPointEscalar(
        babyJub.Base8,
        formatPrivKeyForBabyJub(privKey),
    )

    // TODO: assert that pubKey is valid
    // TODO: figure out how to check if pubKey is valid

    return pubKey
}

/*
 * Generates an Elliptic-curve Diffie–Hellman shared key given a private key
 * and a public key.
 * @return The ECDH shared key.
 */
const genEcdhSharedKey = (
    privKey: PrivKey,
    pubKey: PubKey,
): EcdhSharedKey => {

    return babyJub.mulPointEscalar(pubKey, formatPrivKeyForBabyJub(privKey))[0]
}

/*
 * Encrypts a plaintext using a given key.
 * @return The ciphertext.
 */
const encrypt = (
    plaintext: Plaintext,
    sharedKey: EcdhSharedKey,
): Ciphertext => {

    // Generate the IV
    const iv = mimcsponge.multiHash(plaintext, 0, 1)

    const ciphertext: Ciphertext = {
        iv,
        data: plaintext.map((e: SnarkBigInt, i: Number): SnarkBigInt => {
            return e + mimcsponge.multiHash(
                [sharedKey], 
                iv + snarkjs.bigInt(i),
                1,
            )
        }),
    }

    // TODO: add asserts here
    return ciphertext
}

/*
 * Decrypts a ciphertext using a given key.
 * @return The plaintext.
 */
const decrypt = (
    ciphertext: Ciphertext,
    sharedKey: EcdhSharedKey,
): Plaintext => {

    const plaintext: Plaintext = ciphertext.data.map((e: SnarkBigInt, i: Number): SnarkBigInt => {
        return e - mimcsponge.multiHash(
            [sharedKey],
            ciphertext.iv + snarkjs.bigInt(i),
            1,
        )
    })

    return plaintext
}

/*
 * Generates a signature given a private key and plaintext.
 * @return The signature.
 */
const sign = (
    privKey: PrivKey,
    message: Plaintext,
): Signature => {

    // TODO: make these intermediate variables have more meaningful names
    const h1 = bigInt2Buffer(mimcspongeHashOne(privKey))

    const sBuff = eddsa.pruneBuffer(h1.slice(0, 32))
    const s = snarkjs.bigInt.leBuff2int(sBuff)
    const A = babyJub.mulPointEscalar(babyJub.Base8, s.shr(3))

    const msgBuff = snarkjs.bigInt.leInt2Buff(
        message,
        32
    )

    const rBuff = bigInt2Buffer(
        mimcspongeHashOne(
            buffer2BigInt(Buffer.concat(
                [h1.slice(32, 64), msgBuff]
            ))
        )
    )

    let r = snarkjs.bigInt.leBuff2int(rBuff)
    r = r.mod(babyJub.subOrder)

    const R8 = babyJub.mulPointEscalar(babyJub.Base8, r)
    const hm = mimcsponge.multiHash([R8[0], R8[1], A[0], A[1], message], 0, 1)
    const S = r.add(hm.mul(s)).mod(babyJub.subOrder)

    const signature: Signature = { R8, S }

    return signature
}

/*
 * Checks whether the signature of the given plaintext was created using the
 * private key associated with the given public key.
 * @return True if the signature is valid, and false otherwise.
 */
const verifySignature = (
    message: Plaintext,
    signature: Signature,
    publicKey: PubKey,
): boolean => {

  return eddsa.verifyMiMCSponge(message, signature, publicKey)
}


export {
    genPrivKey,
    genPubKey,
    genEcdhSharedKey,
    encrypt,
    decrypt,
    sign,
    verifySignature,
    PrivKey,
    PubKey,
    EcdhSharedKey,
    Ciphertext,
    Plaintext,
}
