---
title: StateLeaf
sidebar_label: StateLeaf
---

**`Notice`**

A leaf in the state tree, which maps
public keys to voice credit balances

## Implements

- [`IStateLeaf`](../interfaces/IStateLeaf.md)

## Table of contents

### Constructors

- [constructor](StateLeaf.md#constructor)

### Properties

- [pubKey](StateLeaf.md#pubkey)
- [timestamp](StateLeaf.md#timestamp)
- [voiceCreditBalance](StateLeaf.md#voicecreditbalance)

### Methods

- [asArray](StateLeaf.md#asarray)
- [asCircuitInputs](StateLeaf.md#ascircuitinputs)
- [asContractParam](StateLeaf.md#ascontractparam)
- [copy](StateLeaf.md#copy)
- [equals](StateLeaf.md#equals)
- [hash](StateLeaf.md#hash)
- [serialize](StateLeaf.md#serialize)
- [toJSON](StateLeaf.md#tojson)
- [deserialize](StateLeaf.md#deserialize)
- [fromJSON](StateLeaf.md#fromjson)
- [genBlankLeaf](StateLeaf.md#genblankleaf)
- [genRandomLeaf](StateLeaf.md#genrandomleaf)

## Constructors

### constructor

• **new StateLeaf**(`pubKey`, `voiceCreditBalance`, `timestamp`): [`StateLeaf`](StateLeaf.md)

Create a new instance of a state leaf

#### Parameters

| Name                 | Type                  | Description                              |
| :------------------- | :-------------------- | :--------------------------------------- |
| `pubKey`             | [`PubKey`](PubKey.md) | the public key of the user signin up     |
| `voiceCreditBalance` | `bigint`              | the voice credit balance of the user     |
| `timestamp`          | `bigint`              | the timestamp of when the user signed-up |

#### Returns

[`StateLeaf`](StateLeaf.md)

#### Defined in

[stateLeaf.ts:25](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L25)

## Properties

### pubKey

• **pubKey**: [`PubKey`](PubKey.md)

#### Implementation of

[IStateLeaf](../interfaces/IStateLeaf.md).[pubKey](../interfaces/IStateLeaf.md#pubkey)

#### Defined in

[stateLeaf.ts:13](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L13)

---

### timestamp

• **timestamp**: `bigint`

#### Defined in

[stateLeaf.ts:17](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L17)

---

### voiceCreditBalance

• **voiceCreditBalance**: `bigint`

#### Implementation of

[IStateLeaf](../interfaces/IStateLeaf.md).[voiceCreditBalance](../interfaces/IStateLeaf.md#voicecreditbalance)

#### Defined in

[stateLeaf.ts:15](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L15)

## Methods

### asArray

▸ **asArray**(): `bigint`[]

Return this state leaf as an array of bigints

#### Returns

`bigint`[]

the state leaf as an array of bigints

#### Defined in

[stateLeaf.ts:79](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L79)

---

### asCircuitInputs

▸ **asCircuitInputs**(): `bigint`[]

Return this state leaf as an array of bigints

#### Returns

`bigint`[]

the state leaf as an array of bigints

#### Defined in

[stateLeaf.ts:85](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L85)

---

### asContractParam

▸ **asContractParam**(): [`IStateLeafContractParams`](../interfaces/IStateLeafContractParams.md)

Return this state leaf as a contract param

#### Returns

[`IStateLeafContractParams`](../interfaces/IStateLeafContractParams.md)

the state leaf as a contract param (object)

#### Defined in

[stateLeaf.ts:97](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L97)

---

### copy

▸ **copy**(): [`StateLeaf`](StateLeaf.md)

Crate a deep copy of the object

#### Returns

[`StateLeaf`](StateLeaf.md)

a copy of the state leaf

#### Defined in

[stateLeaf.ts:35](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L35)

---

### equals

▸ **equals**(`s`): `boolean`

Check if two state leaves are equal

#### Parameters

| Name | Type                        | Description                    |
| :--- | :-------------------------- | :----------------------------- |
| `s`  | [`StateLeaf`](StateLeaf.md) | the state leaf to compare with |

#### Returns

`boolean`

whether they are equal or not

#### Defined in

[stateLeaf.ts:110](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L110)

---

### hash

▸ **hash**(): `bigint`

Hash this state leaf (first convert as array)

#### Returns

`bigint`

the has of the state leaf elements

#### Defined in

[stateLeaf.ts:91](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L91)

---

### serialize

▸ **serialize**(): `string`

Serialize the state leaf

#### Returns

`string`

**`Notice`**

serialize the public key

**`Notice`**

convert the voice credit balance and timestamp to a hex string

#### Defined in

[stateLeaf.ts:122](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L122)

---

### toJSON

▸ **toJSON**(): [`IJsonStateLeaf`](../interfaces/IJsonStateLeaf.md)

Serialize to a JSON object

#### Returns

[`IJsonStateLeaf`](../interfaces/IJsonStateLeaf.md)

#### Defined in

[stateLeaf.ts:143](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L143)

---

### deserialize

▸ **deserialize**(`serialized`): [`StateLeaf`](StateLeaf.md)

Deserialize the state leaf

#### Parameters

| Name         | Type     | Description               |
| :----------- | :------- | :------------------------ |
| `serialized` | `string` | the serialized state leaf |

#### Returns

[`StateLeaf`](StateLeaf.md)

a deserialized state leaf

#### Defined in

[stateLeaf.ts:133](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L133)

---

### fromJSON

▸ **fromJSON**(`json`): [`StateLeaf`](StateLeaf.md)

Deserialize into a StateLeaf instance

#### Parameters

| Name   | Type                                                | Description             |
| :----- | :-------------------------------------------------- | :---------------------- |
| `json` | [`IJsonStateLeaf`](../interfaces/IJsonStateLeaf.md) | the json representation |

#### Returns

[`StateLeaf`](StateLeaf.md)

the deserialized object as a StateLeaf instance

#### Defined in

[stateLeaf.ts:156](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L156)

---

### genBlankLeaf

▸ **genBlankLeaf**(): [`StateLeaf`](StateLeaf.md)

Generate a blank state leaf

#### Returns

[`StateLeaf`](StateLeaf.md)

a blank state leaf

#### Defined in

[stateLeaf.ts:47](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L47)

---

### genRandomLeaf

▸ **genRandomLeaf**(): [`StateLeaf`](StateLeaf.md)

Generate a random leaf (random salt and random key pair)

#### Returns

[`StateLeaf`](StateLeaf.md)

a random state leaf

#### Defined in

[stateLeaf.ts:70](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/stateLeaf.ts#L70)
