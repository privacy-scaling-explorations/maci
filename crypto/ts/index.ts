import * as assert from 'assert'
import * as crypto from 'crypto'
import * as ethers from 'ethers'
const ff = require('ffjavascript')
import { babyJub, mimc7, poseidon, eddsa } from 'circomlib'
import { IncrementalQuinTree } from './IncrementalQuinTree'
import { AccQueue } from './AccQueue'
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
const unstringifyBigInts: (obj: object) => any = ff.utils.unstringifyBigInts

type SnarkBigInt = BigInt
type PrivKey = BigInt
type PubKey = BigInt[]
type EcdhSharedKey = BigInt
type Plaintext = BigInt[]

class G1Point {
    public x: BigInt
    public y: BigInt

    constructor (
        _x: BigInt,
        _y: BigInt,
    ) {
        // TODO: add range checks
        this.x = _x
        this.y = _y
    }

    public equals(pt: G1Point): boolean {
        return this.x === pt.x && this.y === pt.y
    }

    public asContractParam() {
        return {
            x: this.x.toString(),
            y: this.y.toString(),
        }
    }
}

class G2Point {
    public x: BigInt[]
    public y: BigInt[]

    constructor (
        _x: BigInt[],
        _y: BigInt[],
    ) {
        // TODO: add range checks
        this.x = _x
        this.y = _y
    }

    public equals(pt: G2Point): boolean {
        return this.x[0] === pt.x[0] &&
               this.x[1] === pt.x[1] &&
               this.y[0] === pt.y[0] &&
               this.y[1] === pt.y[1]
    }

    public asContractParam() {
        return {
            x: this.x.map((n) => n.toString()),
            y: this.y.map((n) => n.toString()),
        }
    }
}

/*
 * A private key and a public key
 */
interface Keypair {
    privKey: PrivKey;
    pubKey: PubKey;
}

interface Ciphertext {
    // The initialisation vector
    iv: BigInt;

    // The encrypted data
    data: BigInt[];
}

// An EdDSA signature.
// TODO: document what R8 and S mean
interface Signature {
    R8: BigInt[];
    S: BigInt;
}

// The BN254 group order p
const SNARK_FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
)

// A nothing-up-my-sleeve zero value
// Should be equal to 8370432830353022751713833565135785980866757267633941821328460903436894336785
const NOTHING_UP_MY_SLEEVE =
    BigInt(
        ethers.utils.solidityKeccak256(
            ['bytes'],
            [ethers.utils.toUtf8Bytes('Maci')],
        ),
    ) % SNARK_FIELD_SIZE

/*
 * Convert a BigInt to a Buffer
 */
const bigInt2Buffer = (i: BigInt): Buffer => {
    return Buffer.from(i.toString(16))
}

/*
 * Convert a Buffer to a BigInt
 */
const buffer2BigInt = (b: Buffer): BigInt => {
    return BigInt('0x' + b.toString('hex'))
}

const sha256Hash = (input: BigInt[]) => {
    const types: string[] = []
    for (let i = 0; i < input.length; i ++) {
        types.push('uint256')
    }
    return BigInt(
        ethers.utils.soliditySha256(
            types,
            input.map((x) => x.toString()),
        ),
    ) % SNARK_FIELD_SIZE
}

// Hash up to 2 elements
const poseidonT3 = (inputs: BigInt[]) => {
    assert(inputs.length === 2)
    return poseidon(inputs)
}

// Hash up to 3 elements
const poseidonT4 = (inputs: BigInt[]) => {
    assert(inputs.length === 3)
    return poseidon(inputs)
}

// Hash up to 4 elements
const poseidonT5 = (inputs: BigInt[]) => {
    assert(inputs.length === 4)
    return poseidon(inputs)
}

// Hash up to 5 elements
const poseidonT6 = (inputs: BigInt[]) => {
    assert(inputs.length === 5)
    return poseidon(inputs)
}

const hashN = (numElements: number, elements: Plaintext): BigInt => {
    const elementLength = elements.length
    if (elements.length > numElements) {
        throw new TypeError(`the length of the elements array should be at most ${numElements}; got ${elements.length}`)
    }
    const elementsPadded = elements.slice()
    if (elementLength < numElements) {
        for (let i = elementLength; i < numElements; i++) {
            elementsPadded.push(BigInt(0))
        }
    }

    const funcs = {
        2: poseidonT3,
        3: poseidonT4,
        4: poseidonT5,
        5: poseidonT6,
    }

    return funcs[numElements](elements)
}

const hash3 = (elements: Plaintext): BigInt => hashN(3, elements)
const hash4 = (elements: Plaintext): BigInt => hashN(4, elements)
const hash5 = (elements: Plaintext): BigInt => hashN(5, elements)

/*
 * A convenience function for to use Poseidon to hash a Plaintext with
 * no more than 11 elements
 */
// TODO: remove if unused
const hash11 = (elements: Plaintext): BigInt => {
    const elementLength = elements.length
    if (elementLength > 11) {
        throw new TypeError(`the length of the elements array should be at most 11; got ${elements.length}`)
    }
    const elementsPadded = elements.slice()
    if (elementLength < 11) {
        for (let i = elementLength; i < 11; i++) {
            elementsPadded.push(BigInt(0))
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
 * A convenience function for to use Poseidon to hash a Plaintext with
 * no more than 12 elements
 */
// TODO: remove if unused
const hash12 = (elements: Plaintext): BigInt => {
    const elementLength = elements.length
    if (elementLength > 12) {
        throw new TypeError(`the length of the elements array should be at most 12; got ${elements.length}`)
    }
    const elementsPadded = elements.slice()
    if (elementLength < 12) {
        for (let i = elementLength; i < 12; i++) {
            elementsPadded.push(BigInt(0))
        }
    }

    return poseidonT5([
        poseidonT6(elementsPadded.slice(0, 5)),
        poseidonT6(elementsPadded.slice(5, 10)),
        elementsPadded[10],
        elementsPadded[11],
    ])
}

/*
 * Hash a single BigInt with the Poseidon hash function
 */
const hashOne = (preImage: BigInt): BigInt => {

    return poseidonT3([preImage, BigInt(0)])
}

/*
 * Hash two BigInts with the Poseidon hash function
 */
const hashLeftRight = (left: BigInt, right: BigInt): BigInt => {
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
const genRandomBabyJubValue = (): BigInt => {

    // Prevent modulo bias
    //const lim = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000')
    //const min = (lim - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE
    const min = BigInt('6350874878119819312338956282401532410528162663560392320966563075034087161851')

    let rand
    while (true) {
        rand = BigInt('0x' + crypto.randomBytes(32).toString('hex'))

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
const genPrivKey = (): PrivKey => {

    return genRandomBabyJubValue()
}

/*
 * @return A BabyJub-compatible salt.
 */
const genRandomSalt = (): PrivKey=> {

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

    const s = ff.utils.leBuff2int(sBuff)
    return ff.Scalar.shr(s, 3)
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
 * Generates an Elliptic-Curve Diffie–Hellman (ECDH) shared key given a private
 * key and a public key.
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

    // Generate the initialisation vector
    const iv = mimc7.multiHash(plaintext, BigInt(0))

    const ciphertext: Ciphertext = {
        iv,
        data: plaintext.map((e: BigInt, i: number): BigInt => {
            return BigInt(
                e + mimc7.hash(sharedKey, iv + BigInt(i))
            ) % SNARK_FIELD_SIZE
        }),
    }

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
        (e: BigInt, i: number): BigInt => {
            const val = 
                BigInt(e) - 
                BigInt(
                    mimc7.hash(
                        sharedKey,
                        BigInt(ciphertext.iv) + BigInt(i)
                    )
                )

            if (val < BigInt(0)) {
                return SNARK_FIELD_SIZE + val
            } else {
                return val
            }
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
    hashedData: BigInt,
): Signature => {
    // This implementation differs from iden3's in that it uses Poseidon
    // instead of Blake512

    // TODO: make these intermediate variables have more meaningful names
    const h1 = bigInt2Buffer(hashOne(privKey))

    // TODO: document these steps
    const sBuff = eddsa.pruneBuffer(h1.slice(0, 32))
    const s = ff.utils.leBuff2int(sBuff)
    const A = babyJub.mulPointEscalar(babyJub.Base8, ff.Scalar.shr(s, 3))

    const msgBuff = ff.utils.leInt2Buff(hashedData, 32)
	const slice = Uint8Array.from(h1.slice(32, 64))

    const concat = new Uint8Array(slice.length + msgBuff.length)
    concat.set(slice)
    concat.set(msgBuff, slice.length)

    let r = hashOne(ff.utils.beBuff2int(concat))
    const Fr = new ff.F1Field(babyJub.subOrder)
    r = Fr.e(r)

    const R8 = babyJub.mulPointEscalar(babyJub.Base8, r)
    const hm = hash5([R8[0], R8[1], A[0], A[1], hashedData])
    const S =  Fr.add(r , Fr.mul(hm, s));

    const signature: Signature = { R8, S }

    return signature
}

/*
 * Checks whether the signature of the given plaintext was created using the
 * private key associated with the given public key.
 * @return True if the signature is valid, and false otherwise.
 */
const verifySignature = (
    hashedData: BigInt,
    signature: Signature,
    pubKey: PubKey,
): boolean => {

    return eddsa.verifyPoseidon(hashedData, signature, pubKey)
}

export {
    genRandomSalt,
    genPrivKey,
    genPubKey,
    genKeypair,
    genEcdhSharedKey,
    encrypt,
    decrypt,
    sign,
    sha256Hash,
    hashOne,
    hash3,
    hash4,
    hash5,
    hash11,
    hash12,
    hashLeftRight,
    verifySignature,
    Signature,
    PrivKey,
    PubKey,
    G1Point,
    G2Point,
    Keypair,
    EcdhSharedKey,
    Ciphertext,
    Plaintext,
    SnarkBigInt,
    stringifyBigInts,
    unstringifyBigInts,
    formatPrivKeyForBabyJub,
    IncrementalQuinTree,
    AccQueue,
    NOTHING_UP_MY_SLEEVE,
    SNARK_FIELD_SIZE,
    bigInt2Buffer,
    packPubKey,
    unpackPubKey,
}
