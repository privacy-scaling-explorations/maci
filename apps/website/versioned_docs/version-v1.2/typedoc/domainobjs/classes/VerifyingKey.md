---
title: VerifyingKey
sidebar_label: VerifyingKey
---

**`Notice`**

A TS Class representing a zk-SNARK VerifyingKey

## Table of contents

### Constructors

- [constructor](VerifyingKey.md#constructor)

### Properties

- [alpha1](VerifyingKey.md#alpha1)
- [beta2](VerifyingKey.md#beta2)
- [delta2](VerifyingKey.md#delta2)
- [gamma2](VerifyingKey.md#gamma2)
- [ic](VerifyingKey.md#ic)

### Methods

- [asContractParam](VerifyingKey.md#ascontractparam)
- [copy](VerifyingKey.md#copy)
- [equals](VerifyingKey.md#equals)
- [fromContract](VerifyingKey.md#fromcontract)
- [fromJSON](VerifyingKey.md#fromjson)
- [fromObj](VerifyingKey.md#fromobj)

## Constructors

### constructor

• **new VerifyingKey**(`alpha1`, `beta2`, `gamma2`, `delta2`, `ic`): [`VerifyingKey`](VerifyingKey.md)

Generate a new VerifyingKey

#### Parameters

| Name     | Type        | Description      |
| :------- | :---------- | :--------------- |
| `alpha1` | `G1Point`   | the alpha1 point |
| `beta2`  | `G2Point`   | the beta2 point  |
| `gamma2` | `G2Point`   | the gamma2 point |
| `delta2` | `G2Point`   | the delta2 point |
| `ic`     | `G1Point`[] | the ic points    |

#### Returns

[`VerifyingKey`](VerifyingKey.md)

#### Defined in

[verifyingKey.ts:27](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L27)

## Properties

### alpha1

• **alpha1**: `G1Point`

#### Defined in

[verifyingKey.ts:9](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L9)

---

### beta2

• **beta2**: `G2Point`

#### Defined in

[verifyingKey.ts:11](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L11)

---

### delta2

• **delta2**: `G2Point`

#### Defined in

[verifyingKey.ts:15](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L15)

---

### gamma2

• **gamma2**: `G2Point`

#### Defined in

[verifyingKey.ts:13](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L13)

---

### ic

• **ic**: `G1Point`[]

#### Defined in

[verifyingKey.ts:17](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L17)

## Methods

### asContractParam

▸ **asContractParam**(): [`IVkContractParams`](../interfaces/IVkContractParams.md)

Return this as an object which can be passed
to the smart contract

#### Returns

[`IVkContractParams`](../interfaces/IVkContractParams.md)

the object representation of this

#### Defined in

[verifyingKey.ts:40](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L40)

---

### copy

▸ **copy**(): [`VerifyingKey`](VerifyingKey.md)

Produce a copy of this verifying key

#### Returns

[`VerifyingKey`](VerifyingKey.md)

the copy

#### Defined in

[verifyingKey.ts:94](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L94)

---

### equals

▸ **equals**(`vk`): `boolean`

Check whether this is equal to another verifying key

#### Parameters

| Name | Type                              | Description             |
| :--- | :-------------------------------- | :---------------------- |
| `vk` | [`VerifyingKey`](VerifyingKey.md) | the other verifying key |

#### Returns

`boolean`

whether this is equal to the other verifying key

#### Defined in

[verifyingKey.ts:73](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L73)

---

### fromContract

▸ **fromContract**(`data`): [`VerifyingKey`](VerifyingKey.md)

Create a new verifying key from a contract representation of the VK

#### Parameters

| Name   | Type                                                      | Description               |
| :----- | :-------------------------------------------------------- | :------------------------ |
| `data` | [`IVkContractParams`](../interfaces/IVkContractParams.md) | the object representation |

#### Returns

[`VerifyingKey`](VerifyingKey.md)

a new VerifyingKey

#### Defined in

[verifyingKey.ts:55](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L55)

---

### fromJSON

▸ **fromJSON**(`json`): [`VerifyingKey`](VerifyingKey.md)

Deserialize into a VerifyingKey instance

#### Parameters

| Name   | Type     | Description             |
| :----- | :------- | :---------------------- |
| `json` | `string` | the JSON representation |

#### Returns

[`VerifyingKey`](VerifyingKey.md)

the VerifyingKey

#### Defined in

[verifyingKey.ts:115](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L115)

---

### fromObj

▸ **fromObj**(`data`): [`VerifyingKey`](VerifyingKey.md)

Convert an object representation to a VerifyingKey

#### Parameters

| Name   | Type                                                  | Description               |
| :----- | :---------------------------------------------------- | :------------------------ |
| `data` | [`IVkObjectParams`](../interfaces/IVkObjectParams.md) | the object representation |

#### Returns

[`VerifyingKey`](VerifyingKey.md)

the VerifyingKey

#### Defined in

[verifyingKey.ts:125](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/verifyingKey.ts#L125)
