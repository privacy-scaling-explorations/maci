import * as assert from "assert";
import * as ethers from "ethers";
import { randomBytes } from "crypto";
import { SNARK_FIELD_SIZE, bigInt2Buffer } from "./index";
import {
    babyJub,
    poseidon,
    poseidonEncrypt,
    poseidonDecrypt,
    eddsa,
} from "circomlib";
import { utils, Scalar } from "ffjavascript";
import {
    Ciphertext,
    EcdhSharedKey,
    Plaintext,
    Point,
    PrivKey,
    PubKey,
    PoseidonFuncs,
    Keypair,
    Signature,
} from "./types";
const createBlakeHash = require("blake-hash");

/**
 * @notice A class representing a point on the first group (G1)
 * of the Jubjub curve
 */
export class G1Point {
    public x: bigint;
    public y: bigint;

    constructor(_x: bigint, _y: bigint) {
        assert(_x < SNARK_FIELD_SIZE && _x >= 0, "G1Point x out of range");
        assert(_y < SNARK_FIELD_SIZE && _y >= 0, "G1Point y out of range");
        this.x = _x;
        this.y = _y;
    }

    /**
     * Check whether two points are equal
     * @param pt the point to compare with
     * @returns whether they are equal or not
     */
    public equals(pt: G1Point): boolean {
        return this.x === pt.x && this.y === pt.y;
    }

    /**
     * Return the point as a contract param in the form of an object
     * @returns the point as a contract param
     */
    public asContractParam() {
        return {
            x: this.x.toString(),
            y: this.y.toString(),
        };
    }
}

/**
 * @notice A class representing a point on the second group (G2)
 * of the Jubjub curve. This is usually an extension field of the
 * base field of the curve.
 */
export class G2Point {
    public x: bigint[];
    public y: bigint[];

    constructor(_x: bigint[], _y: bigint[]) {
        for (const n of _x)
            assert(n < SNARK_FIELD_SIZE && n >= 0, "G2Point x out of range");
        for (const n of _y)
            assert(n < SNARK_FIELD_SIZE && n >= 0, "G2Point y out of range");
        this.x = _x;
        this.y = _y;
    }

    /**
     * Check whether two points are equal
     * @param pt the point to compare with
     * @returns whether they are equal or not
     */
    public equals(pt: G2Point): boolean {
        return (
            this.x[0] === pt.x[0] &&
            this.x[1] === pt.x[1] &&
            this.y[0] === pt.y[0] &&
            this.y[1] === pt.y[1]
        );
    }

    /**
     * Return the point as a contract param in the form of an object
     * @returns the point as a contract param
     */
    public asContractParam() {
        return {
            x: this.x.map((n) => n.toString()),
            y: this.y.map((n) => n.toString()),
        };
    }
}

/**
 * Hash an array of uint256 values the same way that the EVM does.
 * @param input - the array of values to hash
 * @returns a EVM compatible sha256 hash
 */
export const sha256Hash = (input: bigint[]): bigint => {
    const types: string[] = [];
    for (let i = 0; i < input.length; i++) {
        types.push("uint256");
    }
    return (
        BigInt(
            ethers.utils.soliditySha256(
                types,
                input.map((x) => x.toString())
            )
        ) % SNARK_FIELD_SIZE
    );
};

/**
 * Hash two BigInts with the Poseidon hash function
 * @param left The left-hand element to hash
 * @param right The right-hand element to hash
 * @returns The hash of the two elements
 */
export const hashLeftRight = (left: bigint, right: bigint): bigint => {
    return poseidonT3([left, right]);
};

/**
 * Hash up to 2 elements
 * @param inputs The elements to hash
 * @returns the hash of the elements
 */
export const poseidonT3 = (inputs: bigint[]): bigint => {
    assert(inputs.length === 2);
    return poseidon(inputs);
};

/**
 * Hash up to 3 elements
 * @param inputs The elements to hash
 * @returns the hash of the elements
 */
export const poseidonT4 = (inputs: bigint[]): bigint => {
    assert(inputs.length === 3);
    return poseidon(inputs);
};

/**
 * Hash up to 4 elements
 * @param inputs The elements to hash
 * @retuns the hash of the elements
 */
export const poseidonT5 = (inputs: bigint[]): bigint => {
    assert(inputs.length === 4);
    return poseidon(inputs);
};

/**
 * Hash up to 5 elements
 * @param inputs The elements to hash
 * @returns the hash of the elements
 */
export const poseidonT6 = (inputs: bigint[]): bigint => {
    assert(inputs.length === 5);
    return poseidon(inputs);
};

/**
 * Hash up to N elements
 * @param numElements The number of elements to hash
 * @param elements The elements to hash
 * @returns The hash of the elements
 */
export const hashN = (numElements: number, elements: Plaintext): bigint => {
    const elementLength = elements.length;
    if (elements.length > numElements) {
        throw new TypeError(
            `the length of the elements array should be at most ${numElements}; got ${elements.length}`
        );
    }
    const elementsPadded = elements.slice();
    if (elementLength < numElements) {
        for (let i = elementLength; i < numElements; i++) {
            elementsPadded.push(BigInt(0));
        }
    }

    const funcs: PoseidonFuncs = {
        2: poseidonT3,
        3: poseidonT4,
        4: poseidonT5,
        5: poseidonT6,
    };

    return funcs[numElements](elements);
};

// hash functions
export const hash2 = (elements: Plaintext): bigint => hashN(2, elements);
export const hash3 = (elements: Plaintext): bigint => hashN(3, elements);
export const hash4 = (elements: Plaintext): bigint => hashN(4, elements);
export const hash5 = (elements: Plaintext): bigint => hashN(5, elements);
// @todo look to make this work
export const hash9 = (elements: Plaintext): bigint => hashN(9, elements);

/**
 * A convenience function to use Poseidon to hash a Plaintext with
 * no more than 13 elements
 * @param elements The elements to hash
 * @returns The hash of the elements
 */
export const hash13 = (elements: Plaintext): bigint => {
    const max = 13;
    const elementLength = elements.length;
    if (elementLength > max) {
        throw new TypeError(
            `the length of the elements array should be at most ${max}; got ${elements.length}`
        );
    }
    const elementsPadded = elements.slice();
    if (elementLength < max) {
        for (let i = elementLength; i < max; i++) {
            elementsPadded.push(BigInt(0));
        }
    }
    return poseidonT6([
        elementsPadded[0],
        poseidonT6(elementsPadded.slice(1, 6)),
        poseidonT6(elementsPadded.slice(6, 11)),
        elementsPadded[11],
        elementsPadded[12],
    ]);
};

/**
 * Hash a single BigInt with the Poseidon hash function
 * @param preImage The element to hash
 * @returns The hash of the element
 */
export const hashOne = (preImage: bigint): bigint =>
    poseidonT3([preImage, BigInt(0)]);

/**
 * Returns a BabyJub-compatible random value. We create it by first generating
 * a random value (initially 256 bits large) modulo the snark field size as
 * described in EIP197. This results in a key size of roughly 253 bits and no
 * more than 254 bits. To prevent modulo bias, we then use this efficient
 * algorithm:
 * http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c
 * @returns A BabyJub-compatible random value.
 */
export const genRandomBabyJubValue = (): bigint => {
    // Prevent modulo bias
    //const lim = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000')
    //const min = (lim - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE
    const min = BigInt(
        "6350874878119819312338956282401532410528162663560392320966563075034087161851"
    );

    let privKey: PrivKey = SNARK_FIELD_SIZE;

    do {
        const rand = BigInt("0x" + randomBytes(32).toString("hex"));
        if (rand >= min) {
            privKey = rand % SNARK_FIELD_SIZE;
        }
    } while (privKey >= SNARK_FIELD_SIZE || privKey === undefined);

    return privKey;
};

/**
 * Generate a private key
 * @returns A BabyJub-compatible private key.
 */
export const genPrivKey = (): bigint => {
    return genRandomBabyJubValue();
};

/**
 * Generate a random value
 * @returns A BabyJub-compatible salt.
 */
export const genRandomSalt = (): bigint => {
    return genRandomBabyJubValue();
};

/**
 * An internal function which formats a random private key to be compatible
 * with the BabyJub curve. This is the format which should be passed into the
 * PubKey and other circuits.
 * @param privKey A private key generated using genPrivKey()
 * @returns A BabyJub-compatible private key.
 */
export const formatPrivKeyForBabyJub = (privKey: PrivKey) => {
    const sBuff = eddsa.pruneBuffer(
        createBlakeHash("blake512")
            .update(bigInt2Buffer(privKey))
            .digest()
            .slice(0, 32)
    );
    const s = utils.leBuff2int(sBuff);
    return Scalar.shr(s, 3);
};

/**
 * Losslessly reduces the size of the representation of a public key
 * @param pubKey The public key to pack
 * @returns A packed public key
 */
export const packPubKey = (pubKey: PubKey): Buffer => {
    return babyJub.packPoint(pubKey);
};

/**
 * Restores the original PubKey from its packed representation
 * @param packed The value to unpack
 * @returns The unpacked public key
 */
export const unpackPubKey = (packed: Buffer): PubKey | any => {
    return babyJub.unpackPoint(packed);
};

/**
 * @param privKey A private key generated using genPrivKey()
 * @returns A public key associated with the private key
 */
export const genPubKey = (privKey: PrivKey): PubKey => {
    // Check whether privKey is a field element
    assert(privKey < SNARK_FIELD_SIZE);
    return eddsa.prv2pub(bigInt2Buffer(privKey));
};

/**
 * Generates a keypair.
 * @returns a keypair
 */
export const genKeypair = (): Keypair => {
    const privKey = genPrivKey();
    const pubKey = genPubKey(privKey);

    const keypair: Keypair = { privKey, pubKey };

    return keypair;
};

/**
 * Generates an Elliptic-Curve Diffie–Hellman (ECDH) shared key given a private
 * key and a public key.
 * @param privKey A private key generated using genPrivKey()
 * @param pubKey A public key generated using genPubKey()
 * @returns The ECDH shared key.
 */
export const genEcdhSharedKey = (
    privKey: PrivKey,
    pubKey: PubKey
): EcdhSharedKey => {
    return babyJub.mulPointEscalar(pubKey, formatPrivKeyForBabyJub(privKey));
};

/**
 * Encrypts a plaintext using a given key.
 * @param plaintext The plaintext to encrypt.
 * @param sharedKey The shared key to use for encryption.
 * @param nonce The nonce to use for encryption.
 * @returns The ciphertext.
 */
export const encrypt = (
    plaintext: Plaintext,
    sharedKey: EcdhSharedKey,
    nonce = BigInt(0)
): Ciphertext => {
    const ciphertext = poseidonEncrypt(plaintext, sharedKey, nonce);
    return ciphertext;
};

/**
 * Decrypts a ciphertext using a given key.
 * @param ciphertext The ciphertext to decrypt.
 * @param sharedKey The shared key to use for decryption.
 * @param nonce The nonce to use for decryption.
 * @param length The length of the plaintext.
 * @returns The plaintext.
 */
export const decrypt = (
    ciphertext: Ciphertext,
    sharedKey: EcdhSharedKey,
    nonce: bigint,
    length: number
): Plaintext => {
    const plaintext = poseidonDecrypt(ciphertext, sharedKey, nonce, length);
    return plaintext;
};

/**
 * Generates a signature given a private key and plaintext.
 * @param privKey A private key generated using genPrivKey()
 * @param msg The plaintext to sign.
 * @returns The signature.
 */
export const sign = (privKey: PrivKey, msg: bigint): Signature => {
    return eddsa.signPoseidon(bigInt2Buffer(privKey), msg);
};

/**
 * Checks whether the signature of the given plaintext was created using the
 * private key associated with the given public key.
 * @param msg The plaintext to verify.
 * @param signature The signature to verify.
 * @param pubKey The public key to use for verification.
 * @returns True if the signature is valid, and false otherwise.
 */
export const verifySignature = (
    msg: bigint,
    signature: Signature,
    pubKey: PubKey
): boolean => {
    return eddsa.verifyPoseidon(msg, signature, pubKey);
};

/**
 * Maps bit to a point on the curve
 * @returns the point.
 */
export const bitToCurve = (bit: bigint): Point => {
    switch (bit) {
        case BigInt(0):
            return [BigInt(0), BigInt(1)];
        case BigInt(1):
            return babyJub.Base8;
        default:
            throw new Error("Invalid bit value");
    }
};

/**
 * Maps curve point to bit
 * @param p The point to map.
 * @returns the bit value.
 */
export const curveToBit = (p: Point): bigint => {
    if (p[0] == BigInt(0) && p[1] == BigInt(1)) {
        return BigInt(0);
    } else if (p[0] == babyJub.Base8[0] && p[1] == babyJub.Base8[1]) {
        return BigInt(1);
    } else {
        throw new Error("Invalid point value");
    }
};

/**
 * Sums two points on the jubjub curve
 * @param a The first point
 * @param b The second point
 * @returns the sum of the two points
 */
export const babyJubAddPoint = (a: any, b: any) => babyJub.addPoint(a, b);
