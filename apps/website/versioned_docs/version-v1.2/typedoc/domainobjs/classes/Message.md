---
title: Message
sidebar_label: Message
---

**`Notice`**

An encrypted command and signature.

## Table of contents

### Constructors

- [constructor](Message.md#constructor)

### Properties

- [data](Message.md#data)
- [msgType](Message.md#msgtype)
- [DATA_LENGTH](Message.md#data_length)

### Methods

- [asArray](Message.md#asarray)
- [asCircuitInputs](Message.md#ascircuitinputs)
- [asContractParam](Message.md#ascontractparam)
- [copy](Message.md#copy)
- [equals](Message.md#equals)
- [hash](Message.md#hash)
- [toJSON](Message.md#tojson)
- [fromJSON](Message.md#fromjson)

## Constructors

### constructor

• **new Message**(`msgType`, `data`): [`Message`](Message.md)

Create a new instance of a Message

#### Parameters

| Name      | Type       | Description             |
| :-------- | :--------- | :---------------------- |
| `msgType` | `bigint`   | the type of the message |
| `data`    | `bigint`[] | the data of the message |

#### Returns

[`Message`](Message.md)

#### Defined in

[message.ts:23](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L23)

## Properties

### data

• **data**: `bigint`[]

#### Defined in

[message.ts:14](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L14)

---

### msgType

• **msgType**: `bigint`

#### Defined in

[message.ts:12](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L12)

---

### DATA_LENGTH

▪ `Static` **DATA_LENGTH**: `number` = `10`

#### Defined in

[message.ts:16](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L16)

## Methods

### asArray

▸ **asArray**(): `bigint`[]

Return the message as an array of bigints

#### Returns

`bigint`[]

the message as an array of bigints

#### Defined in

[message.ts:33](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L33)

---

### asCircuitInputs

▸ **asCircuitInputs**(): `bigint`[]

Return the message as a circuit input

#### Returns

`bigint`[]

the message as a circuit input

#### Defined in

[message.ts:48](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L48)

---

### asContractParam

▸ **asContractParam**(): [`IMessageContractParams`](../interfaces/IMessageContractParams.md)

Return the message as a contract param

#### Returns

[`IMessageContractParams`](../interfaces/IMessageContractParams.md)

the message as a contract param

#### Defined in

[message.ts:39](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L39)

---

### copy

▸ **copy**(): [`Message`](Message.md)

Create a copy of the message

#### Returns

[`Message`](Message.md)

a copy of the message

#### Defined in

[message.ts:61](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L61)

---

### equals

▸ **equals**(`m`): `boolean`

Check if two messages are equal

#### Parameters

| Name | Type                    | Description                 |
| :--- | :---------------------- | :-------------------------- |
| `m`  | [`Message`](Message.md) | the message to compare with |

#### Returns

`boolean`

the result of the comparison

#### Defined in

[message.ts:72](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L72)

---

### hash

▸ **hash**(`encPubKey`): `bigint`

Hash the message data and a public key

#### Parameters

| Name        | Type                  | Description                                         |
| :---------- | :-------------------- | :-------------------------------------------------- |
| `encPubKey` | [`PubKey`](PubKey.md) | the public key that is used to encrypt this message |

#### Returns

`bigint`

the hash of the message data and the public key

#### Defined in

[message.ts:55](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L55)

---

### toJSON

▸ **toJSON**(): [`IMessageContractParams`](../interfaces/IMessageContractParams.md)

Serialize to a JSON object

#### Returns

[`IMessageContractParams`](../interfaces/IMessageContractParams.md)

#### Defined in

[message.ts:86](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L86)

---

### fromJSON

▸ **fromJSON**(`json`): [`Message`](Message.md)

Deserialize into a Message instance

#### Parameters

| Name   | Type                                                                | Description             |
| :----- | :------------------------------------------------------------------ | :---------------------- |
| `json` | [`IMessageContractParams`](../interfaces/IMessageContractParams.md) | the json representation |

#### Returns

[`Message`](Message.md)

the deserialized object as a Message instance

#### Defined in

[message.ts:95](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/message.ts#L95)
