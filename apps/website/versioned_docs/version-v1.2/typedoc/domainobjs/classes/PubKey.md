---
title: PubKey
sidebar_label: PubKey
---

**`Notice`**

A class representing a public key
This is a MACI public key, which is not to be
confused with an Ethereum public key.
A serialized MACI public key is prefixed by 'macipk.'
A raw MACI public key can be thought as a pair of
BigIntegers (x, y) representing a point on the baby jubjub curve

## Table of contents

### Constructors

- [constructor](PubKey.md#constructor)

### Properties

- [rawPubKey](PubKey.md#rawpubkey)

### Methods

- [asArray](PubKey.md#asarray)
- [asCircuitInputs](PubKey.md#ascircuitinputs)
- [asContractParam](PubKey.md#ascontractparam)
- [copy](PubKey.md#copy)
- [equals](PubKey.md#equals)
- [hash](PubKey.md#hash)
- [serialize](PubKey.md#serialize)
- [toJSON](PubKey.md#tojson)
- [deserialize](PubKey.md#deserialize)
- [fromJSON](PubKey.md#fromjson)
- [isValidSerializedPubKey](PubKey.md#isvalidserializedpubkey)

## Constructors

### constructor

• **new PubKey**(`rawPubKey`): [`PubKey`](PubKey.md)

Create a new instance of a public key

#### Parameters

| Name        | Type     | Description        |
| :---------- | :------- | :----------------- |
| `rawPubKey` | `PubKey` | the raw public key |

#### Returns

[`PubKey`](PubKey.md)

#### Defined in

[publicKey.ts:24](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L24)

## Properties

### rawPubKey

• **rawPubKey**: `PubKey`

#### Defined in

[publicKey.ts:18](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L18)

## Methods

### asArray

▸ **asArray**(): `bigint`[]

Return this public key as an array of bigints

#### Returns

`bigint`[]

the public key as an array of bigints

#### Defined in

[publicKey.ts:59](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L59)

---

### asCircuitInputs

▸ **asCircuitInputs**(): `string`[]

Return this public key as circuit inputs

#### Returns

`string`[]

an array of strings

#### Defined in

[publicKey.ts:53](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L53)

---

### asContractParam

▸ **asContractParam**(): [`IG1ContractParams`](../interfaces/IG1ContractParams.md)

Return this public key as smart contract parameters

#### Returns

[`IG1ContractParams`](../interfaces/IG1ContractParams.md)

the public key as smart contract parameters

#### Defined in

[publicKey.ts:40](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L40)

---

### copy

▸ **copy**(): [`PubKey`](PubKey.md)

Create a copy of the public key

#### Returns

[`PubKey`](PubKey.md)

a copy of the public key

#### Defined in

[publicKey.ts:34](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L34)

---

### equals

▸ **equals**(`p`): `boolean`

Check whether this public key equals to another public key

#### Parameters

| Name | Type                  | Description                    |
| :--- | :-------------------- | :----------------------------- |
| `p`  | [`PubKey`](PubKey.md) | the public key to compare with |

#### Returns

`boolean`

whether they match

#### Defined in

[publicKey.ts:92](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L92)

---

### hash

▸ **hash**(): `bigint`

Hash the two baby jubjub coordinates

#### Returns

`bigint`

the hash of this public key

#### Defined in

[publicKey.ts:85](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L85)

---

### serialize

▸ **serialize**(): `string`

Generate a serialized public key from this public key object

#### Returns

`string`

the string representation of a serialized public key

#### Defined in

[publicKey.ts:65](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L65)

---

### toJSON

▸ **toJSON**(): [`IJsonPublicKey`](../modules.md#ijsonpublickey)

Serialize this object

#### Returns

[`IJsonPublicKey`](../modules.md#ijsonpublickey)

#### Defined in

[publicKey.ts:128](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L128)

---

### deserialize

▸ **deserialize**(`s`): [`PubKey`](PubKey.md)

Deserialize a serialized public key

#### Parameters

| Name | Type     | Description               |
| :--- | :------- | :------------------------ |
| `s`  | `string` | the serialized public key |

#### Returns

[`PubKey`](PubKey.md)

the deserialized public key

#### Defined in

[publicKey.ts:99](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L99)

---

### fromJSON

▸ **fromJSON**(`json`): [`PubKey`](PubKey.md)

Deserialize a JSON object into a PubKey instance

#### Parameters

| Name   | Type                                             | Description     |
| :----- | :----------------------------------------------- | :-------------- |
| `json` | [`IJsonPublicKey`](../modules.md#ijsonpublickey) | the json object |

#### Returns

[`PubKey`](PubKey.md)

PubKey

#### Defined in

[publicKey.ts:139](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L139)

---

### isValidSerializedPubKey

▸ **isValidSerializedPubKey**(`s`): `boolean`

Check whether a serialized public key is serialized correctly

#### Parameters

| Name | Type     | Description               |
| :--- | :------- | :------------------------ |
| `s`  | `string` | the serialized public key |

#### Returns

`boolean`

whether the serialized public key is valid

#### Defined in

[publicKey.ts:114](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L114)
