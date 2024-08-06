---
title: PrivKey
sidebar_label: PrivKey
---

**`Notice`**

PrivKey is a TS Class representing a MACI PrivateKey (on the jubjub curve)
This is a MACI private key, which is not to be
confused with an Ethereum private key.
A serialized MACI private key is prefixed by 'macisk.'
A raw MACI private key can be thought as a point on the baby jubjub curve

## Table of contents

### Constructors

- [constructor](PrivKey.md#constructor)

### Properties

- [rawPrivKey](PrivKey.md#rawprivkey)

### Methods

- [asCircuitInputs](PrivKey.md#ascircuitinputs)
- [copy](PrivKey.md#copy)
- [serialize](PrivKey.md#serialize)
- [toJSON](PrivKey.md#tojson)
- [deserialize](PrivKey.md#deserialize)
- [fromJSON](PrivKey.md#fromjson)
- [isValidSerializedPrivKey](PrivKey.md#isvalidserializedprivkey)

## Constructors

### constructor

• **new PrivKey**(`rawPrivKey`): [`PrivKey`](PrivKey.md)

Generate a new Private key object

#### Parameters

| Name         | Type             | Description                    |
| :----------- | :--------------- | :----------------------------- |
| `rawPrivKey` | `SnarkBigNumber` | the raw private key (a bigint) |

#### Returns

[`PrivKey`](PrivKey.md)

#### Defined in

[privateKey.ts:21](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/privateKey.ts#L21)

## Properties

### rawPrivKey

• **rawPrivKey**: `SnarkBigNumber`

#### Defined in

[privateKey.ts:15](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/privateKey.ts#L15)

## Methods

### asCircuitInputs

▸ **asCircuitInputs**(): `string`

Return this Private key as a circuit input

#### Returns

`string`

the Private key as a circuit input

#### Defined in

[privateKey.ts:35](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/privateKey.ts#L35)

---

### copy

▸ **copy**(): [`PrivKey`](PrivKey.md)

Create a copy of this Private key

#### Returns

[`PrivKey`](PrivKey.md)

a copy of the Private key

#### Defined in

[privateKey.ts:29](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/privateKey.ts#L29)

---

### serialize

▸ **serialize**(): `string`

Serialize the private key

#### Returns

`string`

the serialized private key

#### Defined in

[privateKey.ts:41](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/privateKey.ts#L41)

---

### toJSON

▸ **toJSON**(): [`IJsonPrivateKey`](../modules.md#ijsonprivatekey)

Serialize this object

#### Returns

[`IJsonPrivateKey`](../modules.md#ijsonprivatekey)

#### Defined in

[privateKey.ts:75](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/privateKey.ts#L75)

---

### deserialize

▸ **deserialize**(`s`): [`PrivKey`](PrivKey.md)

Deserialize the private key

#### Parameters

| Name | Type     | Description                |
| :--- | :------- | :------------------------- |
| `s`  | `string` | the serialized private key |

#### Returns

[`PrivKey`](PrivKey.md)

the deserialized private key

#### Defined in

[privateKey.ts:55](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/privateKey.ts#L55)

---

### fromJSON

▸ **fromJSON**(`json`): [`PrivKey`](PrivKey.md)

Deserialize this object from a JSON object

#### Parameters

| Name   | Type                                               | Description     |
| :----- | :------------------------------------------------- | :-------------- |
| `json` | [`IJsonPrivateKey`](../modules.md#ijsonprivatekey) | the json object |

#### Returns

[`PrivKey`](PrivKey.md)

the deserialized object as a PrivKey instance

#### Defined in

[privateKey.ts:86](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/privateKey.ts#L86)

---

### isValidSerializedPrivKey

▸ **isValidSerializedPrivKey**(`s`): `boolean`

Check if the serialized private key is valid

#### Parameters

| Name | Type     | Description                |
| :--- | :------- | :------------------------- |
| `s`  | `string` | the serialized private key |

#### Returns

`boolean`

whether it is a valid serialized private key

#### Defined in

[privateKey.ts:65](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/privateKey.ts#L65)
