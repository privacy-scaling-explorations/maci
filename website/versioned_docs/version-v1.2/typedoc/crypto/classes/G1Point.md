---
title: G1Point
sidebar_label: G1Point
---

**`Notice`**

A class representing a point on the first group (G1)
of the Jubjub curve

## Table of contents

### Constructors

- [constructor](G1Point.md#constructor)

### Properties

- [x](G1Point.md#x)
- [y](G1Point.md#y)

### Methods

- [asContractParam](G1Point.md#ascontractparam)
- [equals](G1Point.md#equals)

## Constructors

### constructor

• **new G1Point**(`x`, `y`): [`G1Point`](G1Point.md)

Create a new instance of G1Point

#### Parameters

| Name | Type     | Description      |
| :--- | :------- | :--------------- |
| `x`  | `bigint` | the x coordinate |
| `y`  | `bigint` | the y coordinate |

#### Returns

[`G1Point`](G1Point.md)

#### Defined in

[crypto/ts/babyjub.ts:22](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L22)

## Properties

### x

• **x**: `bigint`

#### Defined in

[crypto/ts/babyjub.ts:13](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L13)

---

### y

• **y**: `bigint`

#### Defined in

[crypto/ts/babyjub.ts:15](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L15)

## Methods

### asContractParam

▸ **asContractParam**(): `Object`

Return the point as a contract param in the form of an object

#### Returns

`Object`

the point as a contract param

| Name | Type     |
| :--- | :------- |
| `x`  | `string` |
| `y`  | `string` |

#### Defined in

[crypto/ts/babyjub.ts:42](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L42)

---

### equals

▸ **equals**(`pt`): `boolean`

Check whether two points are equal

#### Parameters

| Name | Type                    | Description               |
| :--- | :---------------------- | :------------------------ |
| `pt` | [`G1Point`](G1Point.md) | the point to compare with |

#### Returns

`boolean`

whether they are equal or not

#### Defined in

[crypto/ts/babyjub.ts:34](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L34)
