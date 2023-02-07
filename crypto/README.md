# maci-crypto

[![NPM Package][crypto-npm-badge]][crypto-npm-link]
[![Actions Status][crypto-actions-badge]][crypto-actions-link]

This module implements abstractions over cryptographic functions which MACI
employs.

## Constants

**`NOTHING_UP_MY_SLEEVE`**: The Keccak256 hash of the string "Maci", modulo
the BN254 group order.

## Types and interfaces

**`PrivKey`**: A private key (a random value modulo the BN254 group order).

**`PubKey`**: An EdDSA public key.

**`Keypair`**: A private key and the public key it generates.

**`EcdhSharedKey`**: An Elliptic-curve Diffie–Hellman shared key.

**`Plaintext`**: An array of unencrypted values.

**`Ciphertext`**: Encrypted `Plaintext`. This data structure abstracts over the
initialisation vector and encrypted data.

**`Signature`**: A signature. This data structure abstracts over the`R8` and
`S` values.

## Classes

**`G1Point`**: A point in the group `G_1` as defined in
[EIP-197](https://eips.ethereum.org/EIPS/eip-197).

**`G2Point`**: A point in the group `G_2` as defined in
[EIP-197](https://eips.ethereum.org/EIPS/eip-197).

## Functions

**`genRandomBabyJubValue`**: Returns a cryptographically secure random value
modulo the BN254 group order, and prevents modulo bias. Relies on Node.js's
`crypto.randomBytes(32)` for entropy.

**`genRandomSalt: BigInt`**

Returns a secure random salt value. Wraps `genRandomBabyJubValue()`.

**`genPrivKey: PrivKey`**

Returns a secure random private key. Wraps `genRandomBabyJubValue()`.

**`genPubKey = (privKey: PrivKey): PubKey `**

Generates the public key associated with the given private key.

**`genKeypair`**: Generates a random private key and its associated public key.

**`formatPrivKeyForBabyJub = (privKey: PrivKey)`**: Formats a random private
key to be compatible with the BabyJub curve. This is the format which should be
passed into the PubKey and other circuits.

**`packPubKey = (pubKey: PubKey): Buffer`**: Losslessly reduces the size of the
representation of a public key.

**`unpackPubKey = (packed: Buffer): PubKey`**: Restores the original PubKey
from its packed representation.

**`genEcdhSharedKey = (privKey: PrivKey, pubKey: PubKey): EcdhSharedKey`**

Generates an ECDH shared key.

**`encrypt = (plaintext: Plaintext, sharedKey: EcdhSharedKey): Ciphertext`**

Encrypts the plaintext with the given key and returns the
associated ciphertext.

**`decrypt = (ciphertext: Ciphertext, sharedKey: EcdhSharedKey): Plaintext`**

Decrypts the ciphertext using the given key.

**`sign = (privKey: PrivKey, message: Plaintext): Signature`**

Produces a signature of the given message using the private key.

**`verifySignature = (message: Plaintext, signature: Signature, publicKey: PubKey): boolean`**

Checks whether the given signature is valid.

### Hash functions

**`sha256Hash = (input: BigInt[]): BigInt`**: a wrapper function over
`ethers.utils.soliditySha256`, where the output is modulo the BN254 group
order.

**`hashOne = (elements: Plaintext): BigInt`**: the Poseidon hash function for
one input. Equivalent to `hash2([input, 0])`.

**`hash2 = (elements: Plaintext): BigInt`**: the Poseidon hash function for 2
inputs.

**`hashLeftRight = (left: BigInt, right: BigInt): BigInt`**: equivalent to
`hash2([left, right])`.

**`hash3 = (elements: Plaintext): BigInt`**: the Poseidon hash function for 3
inputs.

**`hash4 = (elements: Plaintext): BigInt`**: the Poseidon hash function for 4
inputs.

**`hash5 = (elements: Plaintext): BigInt`**: the Poseidon hash function for 5
inputs.

**`hash12 = (elements: Plaintext): BigInt`**: the Poseidon hash function for 12
inputs. Combines other Poseidon hash functions (accepting 5 and 6 inputs) to do
so. Given the following inputs `[i_0, i_1, ... i_11]`, this function hashes
them in the following manner:

```
hash4(
    hash5([i_0, i_1, i_2, i_3, i_4]),
    hash5([i_5, i_6, i_7, i_8, i_9]),
    i_10,
    i_11,
)
```

[crypto-npm-badge]: https://img.shields.io/npm/v/maci-crypto.svg
[crypto-npm-link]: https://www.npmjs.com/package/maci-crypto
[crypto-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/crypto-build.yml/badge.svg
[crypto-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Acrypto
