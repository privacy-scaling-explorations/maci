---
title: Keypair
sidebar_label: Keypair
---

**`Notice`**

A KeyPair is a pair of public and private keys
This is a MACI keypair, which is not to be
confused with an Ethereum public and private keypair.
A MACI keypair is comprised of a MACI public key and a MACI private key

## Table of contents

### Constructors

- [constructor](Keypair.md#constructor)

### Properties

- [privKey](Keypair.md#privkey)
- [pubKey](Keypair.md#pubkey)

### Methods

- [copy](Keypair.md#copy)
- [equals](Keypair.md#equals)
- [toJSON](Keypair.md#tojson)
- [fromJSON](Keypair.md#fromjson)
- [genEcdhSharedKey](Keypair.md#genecdhsharedkey)

## Constructors

### constructor

• **new Keypair**(`privKey?`): [`Keypair`](Keypair.md)

Create a new instance of a Keypair

#### Parameters

| Name       | Type                    | Description                |
| :--------- | :---------------------- | :------------------------- |
| `privKey?` | [`PrivKey`](PrivKey.md) | the private key (optional) |

#### Returns

[`Keypair`](Keypair.md)

**`Notice`**

if no privKey is passed, it will automatically generate a new private key

#### Defined in

[keyPair.ts:26](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/keyPair.ts#L26)

## Properties

### privKey

• **privKey**: [`PrivKey`](PrivKey.md)

#### Defined in

[keyPair.ts:17](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/keyPair.ts#L17)

---

### pubKey

• **pubKey**: [`PubKey`](PubKey.md)

#### Defined in

[keyPair.ts:19](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/keyPair.ts#L19)

## Methods

### copy

▸ **copy**(): [`Keypair`](Keypair.md)

Create a deep clone of this Keypair

#### Returns

[`Keypair`](Keypair.md)

a copy of the Keypair

#### Defined in

[keyPair.ts:41](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/keyPair.ts#L41)

---

### equals

▸ **equals**(`keypair`): `boolean`

Check whether two Keypairs are equal

#### Parameters

| Name      | Type                    | Description                 |
| :-------- | :---------------------- | :-------------------------- |
| `keypair` | [`Keypair`](Keypair.md) | the keypair to compare with |

#### Returns

`boolean`

whether they are equal or not

#### Defined in

[keyPair.ts:58](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/keyPair.ts#L58)

---

### toJSON

▸ **toJSON**(): [`IJsonKeyPair`](../interfaces/IJsonKeyPair.md)

Serialize into a JSON object

#### Returns

[`IJsonKeyPair`](../interfaces/IJsonKeyPair.md)

#### Defined in

[keyPair.ts:75](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/keyPair.ts#L75)

---

### fromJSON

▸ **fromJSON**(`json`): [`Keypair`](Keypair.md)

Deserialize into a Keypair instance

#### Parameters

| Name   | Type                                            |
| :----- | :---------------------------------------------- |
| `json` | [`IJsonKeyPair`](../interfaces/IJsonKeyPair.md) |

#### Returns

[`Keypair`](Keypair.md)

a keypair instance

#### Defined in

[keyPair.ts:87](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/keyPair.ts#L87)

---

### genEcdhSharedKey

▸ **genEcdhSharedKey**(`privKey`, `pubKey`): `EcdhSharedKey`

Generate a shared key

#### Parameters

| Name      | Type                    |
| :-------- | :---------------------- |
| `privKey` | [`PrivKey`](PrivKey.md) |
| `pubKey`  | [`PubKey`](PubKey.md)   |

#### Returns

`EcdhSharedKey`

#### Defined in

[keyPair.ts:49](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/keyPair.ts#L49)
