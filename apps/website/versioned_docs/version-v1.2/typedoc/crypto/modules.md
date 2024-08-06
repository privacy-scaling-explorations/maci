---
title: Crypto Module
sidebar_label: module
sidebar_position: 1
---

## Table of contents

### Classes

- [AccQueue](classes/AccQueue.md)
- [G1Point](classes/G1Point.md)
- [G2Point](classes/G2Point.md)
- [IncrementalQuinTree](classes/IncrementalQuinTree.md)

### Interfaces

- [Keypair](interfaces/Keypair.md)
- [PoseidonFuncs](interfaces/PoseidonFuncs.md)
- [Queue](interfaces/Queue.md)
- [Signature](interfaces/Signature.md)

### Type Aliases

- [Ciphertext](modules.md#ciphertext)
- [EcdhSharedKey](modules.md#ecdhsharedkey)
- [Leaf](modules.md#leaf)
- [PathElements](modules.md#pathelements)
- [Plaintext](modules.md#plaintext)
- [Point](modules.md#point)
- [PrivKey](modules.md#privkey)
- [PubKey](modules.md#pubkey)

### Variables

- [NOTHING_UP_MY_SLEEVE](modules.md#nothing_up_my_sleeve)
- [SNARK_FIELD_SIZE](modules.md#snark_field_size)

### Functions

- [bigInt2Buffer](modules.md#bigint2buffer)
- [calcDepthFromNumLeaves](modules.md#calcdepthfromnumleaves)
- [deepCopyBigIntArray](modules.md#deepcopybigintarray)
- [formatPrivKeyForBabyJub](modules.md#formatprivkeyforbabyjub)
- [genEcdhSharedKey](modules.md#genecdhsharedkey)
- [genKeypair](modules.md#genkeypair)
- [genPrivKey](modules.md#genprivkey)
- [genPubKey](modules.md#genpubkey)
- [genRandomBabyJubValue](modules.md#genrandombabyjubvalue)
- [genRandomSalt](modules.md#genrandomsalt)
- [genTreeCommitment](modules.md#gentreecommitment)
- [genTreeProof](modules.md#gentreeproof)
- [hash13](modules.md#hash13)
- [hash2](modules.md#hash2)
- [hash3](modules.md#hash3)
- [hash4](modules.md#hash4)
- [hash5](modules.md#hash5)
- [hashLeftRight](modules.md#hashleftright)
- [hashN](modules.md#hashn)
- [hashOne](modules.md#hashone)
- [packPubKey](modules.md#packpubkey)
- [poseidonDecrypt](modules.md#poseidondecrypt)
- [poseidonDecryptWithoutCheck](modules.md#poseidondecryptwithoutcheck)
- [poseidonEncrypt](modules.md#poseidonencrypt)
- [sha256Hash](modules.md#sha256hash)
- [sign](modules.md#sign)
- [stringifyBigInts](modules.md#stringifybigints)
- [unpackPubKey](modules.md#unpackpubkey)
- [unstringifyBigInts](modules.md#unstringifybigints)
- [verifySignature](modules.md#verifysignature)

## Type Aliases

### Ciphertext

Ƭ **Ciphertext**\<`N`\>: `N`[]

#### Type parameters

| Name | Type     |
| :--- | :------- |
| `N`  | `bigint` |

#### Defined in

[crypto/ts/types.ts:21](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/types.ts#L21)

---

### EcdhSharedKey

Ƭ **EcdhSharedKey**\<`N`\>: [`N`, `N`]

#### Type parameters

| Name | Type     |
| :--- | :------- |
| `N`  | `bigint` |

#### Defined in

[crypto/ts/types.ts:12](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/types.ts#L12)

---

### Leaf

Ƭ **Leaf**: `bigint`

#### Defined in

[crypto/ts/types.ts:64](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/types.ts#L64)

---

### PathElements

Ƭ **PathElements**: `bigint`[][]

#### Defined in

[crypto/ts/types.ts:24](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/types.ts#L24)

---

### Plaintext

Ƭ **Plaintext**\<`N`\>: `N`[]

#### Type parameters

| Name | Type     |
| :--- | :------- |
| `N`  | `bigint` |

#### Defined in

[crypto/ts/types.ts:18](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/types.ts#L18)

---

### Point

Ƭ **Point**\<`N`\>: [`N`, `N`]

#### Type parameters

| Name | Type             |
| :--- | :--------------- |
| `N`  | `SnarkBigNumber` |

#### Defined in

[crypto/ts/types.ts:15](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/types.ts#L15)

---

### PrivKey

Ƭ **PrivKey**: `SnarkBigNumber`

#### Defined in

[crypto/ts/types.ts:6](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/types.ts#L6)

---

### PubKey

Ƭ **PubKey**\<`N`\>: [`N`, `N`]

#### Type parameters

| Name | Type     |
| :--- | :------- |
| `N`  | `bigint` |

#### Defined in

[crypto/ts/types.ts:9](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/types.ts#L9)

## Variables

### NOTHING_UP_MY_SLEEVE

• `Const` **NOTHING_UP_MY_SLEEVE**: `bigint`

#### Defined in

[crypto/ts/constants.ts:10](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/constants.ts#L10)

---

### SNARK_FIELD_SIZE

• `Const` **SNARK_FIELD_SIZE**: `bigint` = `r`

#### Defined in

[crypto/ts/constants.ts:6](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/constants.ts#L6)

## Functions

### bigInt2Buffer

▸ **bigInt2Buffer**(`i`): `Buffer`

Convert a BigInt to a Buffer

#### Parameters

| Name | Type     | Description           |
| :--- | :------- | :-------------------- |
| `i`  | `bigint` | the bigint to convert |

#### Returns

`Buffer`

the buffer

#### Defined in

[crypto/ts/bigIntUtils.ts:127](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/bigIntUtils.ts#L127)

---

### calcDepthFromNumLeaves

▸ **calcDepthFromNumLeaves**(`hashLength`, `numLeaves`): `number`

Calculate the depth of a tree given the number of leaves

#### Parameters

| Name         | Type     | Description                       |
| :----------- | :------- | :-------------------------------- |
| `hashLength` | `number` | the hashing function param length |
| `numLeaves`  | `number` | how many leaves                   |

#### Returns

`number`

the depth

#### Defined in

[crypto/ts/utils.ts:10](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/utils.ts#L10)

---

### deepCopyBigIntArray

▸ **deepCopyBigIntArray**(`arr`): `bigint`[]

Create a copy of a bigint array

#### Parameters

| Name  | Type       | Description                  |
| :---- | :--------- | :--------------------------- |
| `arr` | `bigint`[] | the array of bigints to copy |

#### Returns

`bigint`[]

a deep copy of the array

#### Defined in

[crypto/ts/bigIntUtils.ts:110](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/bigIntUtils.ts#L110)

---

### formatPrivKeyForBabyJub

▸ **formatPrivKeyForBabyJub**(`privKey`): `bigint`

An internal function which formats a random private key to be compatible
with the BabyJub curve. This is the format which should be passed into the
PubKey and other circuits.

#### Parameters

| Name      | Type             | Description                                |
| :-------- | :--------------- | :----------------------------------------- |
| `privKey` | `SnarkBigNumber` | A private key generated using genPrivKey() |

#### Returns

`bigint`

A BabyJub-compatible private key.

#### Defined in

[crypto/ts/keys.ts:28](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/keys.ts#L28)

---

### genEcdhSharedKey

▸ **genEcdhSharedKey**(`privKey`, `pubKey`): [`EcdhSharedKey`](modules.md#ecdhsharedkey)

Generates an Elliptic-Curve Diffie–Hellman (ECDH) shared key given a private
key and a public key.

#### Parameters

| Name      | Type                          | Description                                |
| :-------- | :---------------------------- | :----------------------------------------- |
| `privKey` | `SnarkBigNumber`              | A private key generated using genPrivKey() |
| `pubKey`  | [`PubKey`](modules.md#pubkey) | A public key generated using genPubKey()   |

#### Returns

[`EcdhSharedKey`](modules.md#ecdhsharedkey)

The ECDH shared key.

#### Defined in

[crypto/ts/keys.ts:76](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/keys.ts#L76)

---

### genKeypair

▸ **genKeypair**(): [`Keypair`](interfaces/Keypair.md)

Generates a keypair.

#### Returns

[`Keypair`](interfaces/Keypair.md)

a keypair

#### Defined in

[crypto/ts/keys.ts:60](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/keys.ts#L60)

---

### genPrivKey

▸ **genPrivKey**(): `bigint`

Generate a private key

#### Returns

`bigint`

A random seed for a private key.

#### Defined in

[crypto/ts/keys.ts:13](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/keys.ts#L13)

---

### genPubKey

▸ **genPubKey**(`privKey`): [`PubKey`](modules.md#pubkey)

#### Parameters

| Name      | Type             | Description                                |
| :-------- | :--------------- | :----------------------------------------- |
| `privKey` | `SnarkBigNumber` | A private key generated using genPrivKey() |

#### Returns

[`PubKey`](modules.md#pubkey)

A public key associated with the private key

#### Defined in

[crypto/ts/keys.ts:51](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/keys.ts#L51)

---

### genRandomBabyJubValue

▸ **genRandomBabyJubValue**(): `bigint`

Returns a BabyJub-compatible random value. We create it by first generating
a random value (initially 256 bits large) modulo the snark field size as
described in EIP197. This results in a key size of roughly 253 bits and no
more than 254 bits. To prevent modulo bias, we then use this efficient
algorithm:
http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c

#### Returns

`bigint`

A BabyJub-compatible random value.

#### Defined in

[crypto/ts/babyjub.ts:115](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L115)

---

### genRandomSalt

▸ **genRandomSalt**(): `bigint`

Generate a random value

#### Returns

`bigint`

A BabyJub-compatible salt.

#### Defined in

[crypto/ts/keys.ts:19](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/keys.ts#L19)

---

### genTreeCommitment

▸ **genTreeCommitment**(`leaves`, `salt`, `depth`): `bigint`

A helper function which hashes a list of results with a salt and returns the
hash.

#### Parameters

| Name     | Type       | Description      |
| :------- | :--------- | :--------------- |
| `leaves` | `bigint`[] | A list of values |
| `salt`   | `bigint`   | A random salt    |
| `depth`  | `number`   | The tree depth   |

#### Returns

`bigint`

The hash of the leaves and the salt, with the salt last

#### Defined in

[crypto/ts/utils.ts:30](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/utils.ts#L30)

---

### genTreeProof

▸ **genTreeProof**(`index`, `leaves`, `depth`): `bigint`[][]

A helper function to generate the tree proof for the value at the given index in the leaves

#### Parameters

| Name     | Type       | Description                                      |
| :------- | :--------- | :----------------------------------------------- |
| `index`  | `number`   | The index of the value to generate the proof for |
| `leaves` | `bigint`[] | A list of values                                 |
| `depth`  | `number`   | The tree depth                                   |

#### Returns

`bigint`[][]

The proof

#### Defined in

[crypto/ts/utils.ts:47](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/utils.ts#L47)

---

### hash13

▸ **hash13**(`elements`): `bigint`

A convenience function to use Poseidon to hash a Plaintext with
no more than 13 elements

#### Parameters

| Name       | Type                                | Description          |
| :--------- | :---------------------------------- | :------------------- |
| `elements` | [`Plaintext`](modules.md#plaintext) | The elements to hash |

#### Returns

`bigint`

The hash of the elements

#### Defined in

[crypto/ts/hashing.ts:130](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/hashing.ts#L130)

---

### hash2

▸ **hash2**(`elements`): `bigint`

#### Parameters

| Name       | Type                                |
| :--------- | :---------------------------------- |
| `elements` | [`Plaintext`](modules.md#plaintext) |

#### Returns

`bigint`

#### Defined in

[crypto/ts/hashing.ts:119](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/hashing.ts#L119)

---

### hash3

▸ **hash3**(`elements`): `bigint`

#### Parameters

| Name       | Type                                |
| :--------- | :---------------------------------- |
| `elements` | [`Plaintext`](modules.md#plaintext) |

#### Returns

`bigint`

#### Defined in

[crypto/ts/hashing.ts:120](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/hashing.ts#L120)

---

### hash4

▸ **hash4**(`elements`): `bigint`

#### Parameters

| Name       | Type                                |
| :--------- | :---------------------------------- |
| `elements` | [`Plaintext`](modules.md#plaintext) |

#### Returns

`bigint`

#### Defined in

[crypto/ts/hashing.ts:121](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/hashing.ts#L121)

---

### hash5

▸ **hash5**(`elements`): `bigint`

#### Parameters

| Name       | Type                                |
| :--------- | :---------------------------------- |
| `elements` | [`Plaintext`](modules.md#plaintext) |

#### Returns

`bigint`

#### Defined in

[crypto/ts/hashing.ts:122](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/hashing.ts#L122)

---

### hashLeftRight

▸ **hashLeftRight**(`left`, `right`): `bigint`

Hash two BigInts with the Poseidon hash function

#### Parameters

| Name    | Type     | Description                    |
| :------ | :------- | :----------------------------- |
| `left`  | `bigint` | The left-hand element to hash  |
| `right` | `bigint` | The right-hand element to hash |

#### Returns

`bigint`

The hash of the two elements

#### Defined in

[crypto/ts/hashing.ts:85](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/hashing.ts#L85)

---

### hashN

▸ **hashN**(`numElements`, `elements`): `bigint`

Hash up to N elements

#### Parameters

| Name          | Type                                | Description                    |
| :------------ | :---------------------------------- | :----------------------------- |
| `numElements` | `number`                            | The number of elements to hash |
| `elements`    | [`Plaintext`](modules.md#plaintext) | The elements to hash           |

#### Returns

`bigint`

The hash of the elements

#### Defined in

[crypto/ts/hashing.ts:101](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/hashing.ts#L101)

---

### hashOne

▸ **hashOne**(`preImage`): `bigint`

Hash a single BigInt with the Poseidon hash function

#### Parameters

| Name       | Type     | Description         |
| :--------- | :------- | :------------------ |
| `preImage` | `bigint` | The element to hash |

#### Returns

`bigint`

The hash of the element

#### Defined in

[crypto/ts/hashing.ts:160](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/hashing.ts#L160)

---

### packPubKey

▸ **packPubKey**(`pubKey`): `bigint`

Losslessly reduces the size of the representation of a public key

#### Parameters

| Name     | Type                          | Description            |
| :------- | :---------------------------- | :--------------------- |
| `pubKey` | [`PubKey`](modules.md#pubkey) | The public key to pack |

#### Returns

`bigint`

A packed public key

#### Defined in

[crypto/ts/keys.ts:35](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/keys.ts#L35)

---

### poseidonDecrypt

▸ **poseidonDecrypt**(`ciphertext`, `key`, `nonce`, `length`): `PlainText`\<`bigint`\>

Decrypt some ciphertext using poseidon encryption

#### Parameters

| Name         | Type                        | Description                 |
| :----------- | :-------------------------- | :-------------------------- |
| `ciphertext` | `CipherText`\<`bigint`\>    | the ciphertext to decrypt   |
| `key`        | `EncryptionKey`\<`bigint`\> | the key to decrypt with     |
| `nonce`      | `bigint`                    | the nonce used to encrypt   |
| `length`     | `number`                    | the length of the plaintext |

#### Returns

`PlainText`\<`bigint`\>

the plaintext

#### Defined in

node_modules/.pnpm/@zk-kit+poseidon-cipher@0.2.1/node_modules/@zk-kit/poseidon-cipher/dist/types/poseidonCipher.d.ts:18

---

### poseidonDecryptWithoutCheck

▸ **poseidonDecryptWithoutCheck**(`ciphertext`, `key`, `nonce`, `length`): `PlainText`\<`bigint`\>

Decrypt some ciphertext using poseidon encryption

#### Parameters

| Name         | Type                        | Description                 |
| :----------- | :-------------------------- | :-------------------------- |
| `ciphertext` | `CipherText`\<`bigint`\>    | the ciphertext to decrypt   |
| `key`        | `EncryptionKey`\<`bigint`\> | the key to decrypt with     |
| `nonce`      | `bigint`                    | the nonce used to encrypt   |
| `length`     | `number`                    | the length of the plaintext |

#### Returns

`PlainText`\<`bigint`\>

the plaintext

**`Dev`**

Do not throw if the plaintext is invalid

#### Defined in

node_modules/.pnpm/@zk-kit+poseidon-cipher@0.2.1/node_modules/@zk-kit/poseidon-cipher/dist/types/poseidonCipher.d.ts:28

---

### poseidonEncrypt

▸ **poseidonEncrypt**(`msg`, `key`, `nonce`): `CipherText`\<`bigint`\>

Encrypt some plaintext using poseidon encryption

#### Parameters

| Name    | Type                        | Description                       |
| :------ | :-------------------------- | :-------------------------------- |
| `msg`   | `PlainText`\<`bigint`\>     | the message to encrypt            |
| `key`   | `EncryptionKey`\<`bigint`\> | the key to encrypt with           |
| `nonce` | `bigint`                    | the nonce to avoid replay attacks |

#### Returns

`CipherText`\<`bigint`\>

the ciphertext

#### Defined in

node_modules/.pnpm/@zk-kit+poseidon-cipher@0.2.1/node_modules/@zk-kit/poseidon-cipher/dist/types/poseidonCipher.d.ts:9

---

### sha256Hash

▸ **sha256Hash**(`input`): `bigint`

Hash an array of uint256 values the same way that the EVM does.

#### Parameters

| Name    | Type       | Description                 |
| :------ | :--------- | :-------------------------- |
| `input` | `bigint`[] | the array of values to hash |

#### Returns

`bigint`

a EVM compatible sha256 hash

#### Defined in

[crypto/ts/hashing.ts:15](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/hashing.ts#L15)

---

### sign

▸ **sign**(`privateKey`, `message`): `Signature`\<`string`\>

Signs a message using the provided private key, employing Poseidon hashing and
EdDSA with the Baby Jubjub elliptic curve.

#### Parameters

| Name         | Type           | Description                               |
| :----------- | :------------- | :---------------------------------------- |
| `privateKey` | `BigNumberish` | The private key used to sign the message. |
| `message`    | `BigNumberish` | The message to be signed.                 |

#### Returns

`Signature`\<`string`\>

The signature object, containing properties relevant to EdDSA signatures, such as 'R8' and 'S' values.

#### Defined in

node_modules/.pnpm/@zk-kit+eddsa-poseidon@0.5.1/node_modules/@zk-kit/eddsa-poseidon/dist/types/eddsa-poseidon.d.ts:32

---

### stringifyBigInts

▸ **stringifyBigInts**(`input`): `StringifiedBigInts`

Given an input of bigint values, convert them to their string representations

#### Parameters

| Name    | Type             | Description          |
| :------ | :--------------- | :------------------- |
| `input` | `BigIntVariants` | The input to convert |

#### Returns

`StringifiedBigInts`

The input with bigint values converted to string

#### Defined in

[crypto/ts/bigIntUtils.ts:78](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/bigIntUtils.ts#L78)

---

### unpackPubKey

▸ **unpackPubKey**(`packed`): [`PubKey`](modules.md#pubkey)

Restores the original PubKey from its packed representation

#### Parameters

| Name     | Type     | Description         |
| :------- | :------- | :------------------ |
| `packed` | `bigint` | The value to unpack |

#### Returns

[`PubKey`](modules.md#pubkey)

The unpacked public key

#### Defined in

[crypto/ts/keys.ts:42](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/keys.ts#L42)

---

### unstringifyBigInts

▸ **unstringifyBigInts**(`input`): `BigIntVariants`

Given an input containing string values, convert them
to bigint

#### Parameters

| Name    | Type                 | Description          |
| :------ | :------------------- | :------------------- |
| `input` | `StringifiedBigInts` | The input to convert |

#### Returns

`BigIntVariants`

the input with string values converted to bigint

#### Defined in

[crypto/ts/bigIntUtils.ts:9](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/bigIntUtils.ts#L9)

---

### verifySignature

▸ **verifySignature**(`message`, `signature`, `publicKey`): `boolean`

Verifies an EdDSA signature using the Baby Jubjub elliptic curve and Poseidon hash function.

#### Parameters

| Name        | Type           | Description                                                              |
| :---------- | :------------- | :----------------------------------------------------------------------- |
| `message`   | `BigNumberish` | The original message that was be signed.                                 |
| `signature` | `Signature`    | The EdDSA signature to be verified.                                      |
| `publicKey` | `Point`        | The public key associated with the private key used to sign the message. |

#### Returns

`boolean`

Returns true if the signature is valid and corresponds to the message and public key, false otherwise.

#### Defined in

node_modules/.pnpm/@zk-kit+eddsa-poseidon@0.5.1/node_modules/@zk-kit/eddsa-poseidon/dist/types/eddsa-poseidon.d.ts:40
