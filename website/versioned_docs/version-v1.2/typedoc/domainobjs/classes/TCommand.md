---
title: TCommand
sidebar_label: TCommand
---

**`Notice`**

Command for submitting a topup request

## Implements

- [`ICommand`](../interfaces/ICommand.md)

## Table of contents

### Constructors

- [constructor](TCommand.md#constructor)

### Properties

- [amount](TCommand.md#amount)
- [cmdType](TCommand.md#cmdtype)
- [pollId](TCommand.md#pollid)
- [stateIndex](TCommand.md#stateindex)

### Methods

- [copy](TCommand.md#copy)
- [equals](TCommand.md#equals)
- [toJSON](TCommand.md#tojson)
- [fromJSON](TCommand.md#fromjson)

## Constructors

### constructor

• **new TCommand**(`stateIndex`, `amount`, `pollId`): [`TCommand`](TCommand.md)

Create a new TCommand

#### Parameters

| Name         | Type     | Description                 |
| :----------- | :------- | :-------------------------- |
| `stateIndex` | `bigint` | the state index of the user |
| `amount`     | `bigint` | the amount of voice credits |
| `pollId`     | `bigint` | the poll ID                 |

#### Returns

[`TCommand`](TCommand.md)

#### Defined in

[commands/TCommand.ts:21](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/TCommand.ts#L21)

## Properties

### amount

• **amount**: `bigint`

#### Defined in

[commands/TCommand.ts:11](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/TCommand.ts#L11)

---

### cmdType

• **cmdType**: `bigint`

#### Implementation of

[ICommand](../interfaces/ICommand.md).[cmdType](../interfaces/ICommand.md#cmdtype)

#### Defined in

[commands/TCommand.ts:7](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/TCommand.ts#L7)

---

### pollId

• **pollId**: `bigint`

#### Defined in

[commands/TCommand.ts:13](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/TCommand.ts#L13)

---

### stateIndex

• **stateIndex**: `bigint`

#### Defined in

[commands/TCommand.ts:9](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/TCommand.ts#L9)

## Methods

### copy

▸ **copy**\<`T`\>(): `T`

Create a deep clone of this TCommand

#### Type parameters

| Name | Type                              |
| :--- | :-------------------------------- |
| `T`  | extends [`TCommand`](TCommand.md) |

#### Returns

`T`

a copy of the TCommand

#### Implementation of

[ICommand](../interfaces/ICommand.md).[copy](../interfaces/ICommand.md#copy)

#### Defined in

[commands/TCommand.ts:32](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/TCommand.ts#L32)

---

### equals

▸ **equals**(`command`): `boolean`

Check whether this command has deep equivalence to another command

#### Parameters

| Name      | Type                      | Description                 |
| :-------- | :------------------------ | :-------------------------- |
| `command` | [`TCommand`](TCommand.md) | the command to compare with |

#### Returns

`boolean`

whether they are equal or not

#### Implementation of

[ICommand](../interfaces/ICommand.md).[equals](../interfaces/ICommand.md#equals)

#### Defined in

[commands/TCommand.ts:39](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/TCommand.ts#L39)

---

### toJSON

▸ **toJSON**(): [`IJsonTCommand`](../interfaces/IJsonTCommand.md)

Serialize into a JSON object

#### Returns

[`IJsonTCommand`](../interfaces/IJsonTCommand.md)

#### Implementation of

[ICommand](../interfaces/ICommand.md).[toJSON](../interfaces/ICommand.md#tojson)

#### Defined in

[commands/TCommand.ts:48](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/TCommand.ts#L48)

---

### fromJSON

▸ **fromJSON**(`json`): [`TCommand`](TCommand.md)

Deserialize into a TCommand object

#### Parameters

| Name   | Type                                              | Description             |
| :----- | :------------------------------------------------ | :---------------------- |
| `json` | [`IJsonTCommand`](../interfaces/IJsonTCommand.md) | the json representation |

#### Returns

[`TCommand`](TCommand.md)

the TCommand instance

#### Defined in

[commands/TCommand.ts:62](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/TCommand.ts#L62)
