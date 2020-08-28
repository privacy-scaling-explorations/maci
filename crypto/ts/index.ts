import * as assert from 'assert'
import * as crypto from 'crypto'
import * as ethers from 'ethers'
import * as snarkjs from 'snarkjs'
import { babyJub, eddsa, mimc7, poseidon } from 'circomlib'
import { IncrementalQuinTree } from './IncrementalQuinTree'
const stringifyBigInts: (obj: object) => any = snarkjs.stringifyBigInts
const unstringifyBigInts: (obj: object) => any = snarkjs.unstringifyBigInts

type SnarkBigInt = snarkjs.bigInt
type PrivKey = SnarkBigInt
type PubKey = SnarkBigInt[]
type EcdhSharedKey = SnarkBigInt
type Plaintext = SnarkBigInt[]

interface Keypair {
    privKey: PrivKey;
    pubKey: PubKey;
}

interface Ciphertext {
    // The initialisation vector
    iv: SnarkBigInt;

    // The encrypted data
    data: SnarkBigInt[];
}

// An EdDSA signature.
// TODO: document what R8 and S mean
interface Signature {
    R8: SnarkBigInt[];
    S: SnarkBigInt;
}

const bigInt = snarkjs.bigInt

const SNARK_FIELD_SIZE = snarkjs.bigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
)

// A nothing-up-my-sleeve zero value
// Should be equal to 5503045433092194285660061905880311622788666850989422096966288514930349325741
const NOTHING_UP_MY_SLEEVE =
    bigInt(ethers.utils.solidityKeccak256(['bytes'], [ethers.utils.toUtf8Bytes('Maci')])) % SNARK_FIELD_SIZE

/*
 * Convert a SnarkBigInt to a Buffer
 */
const bigInt2Buffer = (i: SnarkBigInt): Buffer => {
    return Buffer.from(i.toString(16))
}

/*
 * Convert a Buffer to a SnarkBigInt
 */
const buffer2BigInt = (b: Buffer): BigInt => {
    return snarkjs.bigInt('0x' + b.toString('hex'))
}

// Hash up to 2 elements
const poseidonT3 = (inputs: SnarkBigInt[]) => {
    assert(inputs.length === 2)
    return poseidon(inputs)
}

// Hash up to 5 elements
const poseidonT6 = (inputs: SnarkBigInt[]) => {
    assert(inputs.length === 5)
    return poseidon(inputs)
}

const hash5 = (elements: Plaintext): SnarkBigInt => {
    const elementLength = elements.length
    if (elements.length > 5) {
        throw new Error(`elements length should not greater than 5, got ${elements.length}`)
    }
    const elementsPadded = elements.slice()
    if (elementLength < 5) {
        for (let i = elementLength; i < 5; i++) {
            elementsPadded.push(bigInt(0))
        }
    }
    return poseidonT6(elements)
}

/*
 * A convenience function for to use Poseidon to hash a Plaintext with
 * no more than 11 elements
 */
const hash11 = (elements: Plaintext): SnarkBigInt => {
    const elementLength = elements.length
    if (elementLength > 11) {
        throw new TypeError(`elements length should not greater than 11, got ${elementLength}`)
    }
    const elementsPadded = elements.slice()
    if (elementLength < 11) {
        for (let i = elementLength; i < 11; i++) {
            elementsPadded.push(bigInt(0))
        }
    }
    return poseidonT3([
        poseidonT3([
            poseidonT6(elementsPadded.slice(0, 5)),
            poseidonT6(elementsPadded.slice(5, 10))
        ])
        , elementsPadded[10]
    ])
}

/*
 * A convenience function for to use poseidon to hash a single SnarkBigInt
 */
const hashOne = (preImage: SnarkBigInt): SnarkBigInt => {

    return poseidonT3([preImage, bigInt(0)])
}

/*
 * A convenience function for to use poseidon to hash two SnarkBigInts
 */
const hashLeftRight = (left: SnarkBigInt, right: SnarkBigInt): SnarkBigInt => {
    return poseidonT3([left, right])
}

/*
 * Returns a BabyJub-compatible random value. We create it by first generating
 * a random value (initially 256 bits large) modulo the snark field size as
 * described in EIP197. This results in a key size of roughly 253 bits and no
 * more than 254 bits. To prevent modulo bias, we then use this efficient
 * algorithm:
 * http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c
 * @return A BabyJub-compatible random value.
 */
const genRandomBabyJubValue: SnarkBigInt = (
) => {

    // Check whether we are using the correct value for SNARK_FIELD_SIZE
    assert(SNARK_FIELD_SIZE.eq(snarkjs.bn128.r))

    // Prevent modulo bias
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

    const privKey: PrivKey = rand % SNARK_FIELD_SIZE
    assert(privKey < SNARK_FIELD_SIZE)

    return privKey
}

/*
 * @return A BabyJub-compatible private key.
 */
const genPrivKey: PrivKey = () => {

    return genRandomBabyJubValue()
}

/*
 * @return A BabyJub-compatible salt.
 */
const genRandomSalt: PrivKey = () => {

    return genRandomBabyJubValue()
}

/*
 * An internal function which formats a random private key to be compatible
 * with the BabyJub curve. This is the format which should be passed into the
 * PublicKey and other circuits.
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
            hashOne(privKey)
        ).slice(0, 32)
    )

    return snarkjs.bigInt.leBuff2int(sBuff).shr(3)
}

/*
 * Losslessly reduces the size of the representation of a public key
 * @param pubKey The public key to pack
 * @return A packed public key
 */
const packPubKey = (pubKey: PubKey): Buffer => {
    return babyJub.packPoint(pubKey)
}

/*
 * Restores the original PubKey from its packed representation
 * @param packed The value to unpack
 * @return The unpacked public key
 */
const unpackPubKey = (packed: Buffer): PubKey => {
    return babyJub.unpackPoint(packed)
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

    assert(pubKey.length === 2)
    assert(pubKey[0] < SNARK_FIELD_SIZE)
    assert(pubKey[1] < SNARK_FIELD_SIZE)

    return pubKey
}

const genKeypair = (): Keypair => {
    const privKey = genPrivKey()
    const pubKey = genPubKey(privKey)

    const Keypair: Keypair = { privKey, pubKey }

    return Keypair
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
    const iv = mimc7.multiHash(plaintext, bigInt(0))

    const ciphertext: Ciphertext = {
        iv,
        data: plaintext.map((e: SnarkBigInt, i: number): SnarkBigInt => {
            return e + mimc7.hash(
                sharedKey,
                iv + snarkjs.bigInt(i),
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

    const plaintext: Plaintext = ciphertext.data.map(
        (e: SnarkBigInt, i: number): SnarkBigInt => {
            return e - mimc7.hash(
                sharedKey,
                ciphertext.iv + snarkjs.bigInt(i),
            )
        }
    )

    return plaintext
}

/*
 * Generates a signature given a private key and plaintext.
 * @return The signature.
 */
const sign = (
    privKey: PrivKey,
    hashedData: SnarkBigInt,
): Signature => {

    // TODO: make these intermediate variables have more meaningful names
    const h1 = bigInt2Buffer(hashOne(privKey))

    // TODO: document these steps
    const sBuff = eddsa.pruneBuffer(h1.slice(0, 32))
    const s = snarkjs.bigInt.leBuff2int(sBuff)
    const A = babyJub.mulPointEscalar(babyJub.Base8, s.shr(3))
    const msgBuff = snarkjs.bigInt.leInt2Buff(hashedData, 32)
    const rBuff = bigInt2Buffer(
        hashOne(
            buffer2BigInt(Buffer.concat(
                [h1.slice(32, 64), msgBuff]
            ))
        )
    )

    let r = snarkjs.bigInt.leBuff2int(rBuff)
    r = r.mod(babyJub.subOrder)

    const R8 = babyJub.mulPointEscalar(babyJub.Base8, r)
    const hm = hash5([R8[0], R8[1], A[0], A[1], hashedData])
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
    hashedData: SnarkBigInt,
    signature: Signature,
    pubKey: PubKey,
): boolean => {

    return eddsa.verifyPoseidon(hashedData, signature, pubKey)
}

export {
    SnarkBigInt,
    genRandomSalt,
    genPrivKey,
    genPubKey,
    genKeypair,
    genEcdhSharedKey,
    encrypt,
    decrypt,
    sign,
    hashOne,
    hash5,
    hash11,
    hashLeftRight,
    verifySignature,
    Signature,
    PrivKey,
    PubKey,
    Keypair,
    EcdhSharedKey,
    Ciphertext,
    Plaintext,
    bigInt,
    stringifyBigInts,
    unstringifyBigInts,
    formatPrivKeyForBabyJub,
    IncrementalQuinTree,
    NOTHING_UP_MY_SLEEVE,
    SNARK_FIELD_SIZE,
    bigInt2Buffer,
    packPubKey,
    unpackPubKey,
}
