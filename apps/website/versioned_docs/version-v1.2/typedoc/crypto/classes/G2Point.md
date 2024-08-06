---
title: G2Point
sidebar_label: G2Point
---

**`Notice`**

A class representing a point on the second group (G2)
of the Jubjub curve. This is usually an extension field of the
base field of the curve.

## Table of contents

### Constructors

- [constructor](G2Point.md#constructor)

### Properties

- [x](G2Point.md#x)
- [y](G2Point.md#y)

### Methods

- [asContractParam](G2Point.md#ascontractparam)
- [checkPointsRange](G2Point.md#checkpointsrange)
- [equals](G2Point.md#equals)

## Constructors

### constructor

• **new G2Point**(`x`, `y`): [`G2Point`](G2Point.md)

Create a new instance of G2Point

#### Parameters

| Name | Type       | Description      |
| :--- | :--------- | :--------------- |
| `x`  | `bigint`[] | the x coordinate |
| `y`  | `bigint`[] | the y coordinate |

#### Returns

[`G2Point`](G2Point.md)

#### Defined in

[crypto/ts/babyjub.ts:65](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L65)

## Properties

### x

• **x**: `bigint`[]

#### Defined in

[crypto/ts/babyjub.ts:56](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L56)

---

### y

• **y**: `bigint`[]

#### Defined in

[crypto/ts/babyjub.ts:58](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L58)

## Methods

### asContractParam

▸ **asContractParam**(): `Object`

Return the point as a contract param in the form of an object

#### Returns

`Object`

the point as a contract param

| Name | Type       |
| :--- | :--------- |
| `x`  | `string`[] |
| `y`  | `string`[] |

#### Defined in

[crypto/ts/babyjub.ts:86](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L86)

---

### checkPointsRange

▸ **checkPointsRange**(`x`, `type`): `void`

Check whether the points are in range

#### Parameters

| Name   | Type           | Description                |
| :----- | :------------- | :------------------------- |
| `x`    | `bigint`[]     | the x coordinate           |
| `type` | `"x"` \| `"y"` | the type of the coordinate |

#### Returns

`void`

#### Defined in

[crypto/ts/babyjub.ts:98](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L98)

---

### equals

▸ **equals**(`pt`): `boolean`

Check whether two points are equal

#### Parameters

| Name | Type                    | Description               |
| :--- | :---------------------- | :------------------------ |
| `pt` | [`G2Point`](G2Point.md) | the point to compare with |

#### Returns

`boolean`

whether they are equal or not

#### Defined in

[crypto/ts/babyjub.ts:78](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/babyjub.ts#L78)
