---
title: ICommand
sidebar_label: ICommand
---

**`Notice`**

A parent interface for all the commands

## Implemented by

- [`PCommand`](../classes/PCommand.md)
- [`TCommand`](../classes/TCommand.md)

## Table of contents

### Properties

- [cmdType](ICommand.md#cmdtype)
- [copy](ICommand.md#copy)
- [equals](ICommand.md#equals)
- [toJSON](ICommand.md#tojson)

## Properties

### cmdType

• **cmdType**: `bigint`

#### Defined in

[commands/types.ts:5](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/types.ts#L5)

---

### copy

• **copy**: \<T\>() => `T`

#### Type declaration

▸ \<`T`\>(): `T`

##### Type parameters

| Name | Type                              |
| :--- | :-------------------------------- |
| `T`  | extends [`ICommand`](ICommand.md) |

##### Returns

`T`

#### Defined in

[commands/types.ts:6](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/types.ts#L6)

---

### equals

• **equals**: \<T\>(`command`: `T`) => `boolean`

#### Type declaration

▸ \<`T`\>(`command`): `boolean`

##### Type parameters

| Name | Type                              |
| :--- | :-------------------------------- |
| `T`  | extends [`ICommand`](ICommand.md) |

##### Parameters

| Name      | Type |
| :-------- | :--- |
| `command` | `T`  |

##### Returns

`boolean`

#### Defined in

[commands/types.ts:7](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/types.ts#L7)

---

### toJSON

• **toJSON**: () => `unknown`

#### Type declaration

▸ (): `unknown`

##### Returns

`unknown`

#### Defined in

[commands/types.ts:8](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/types.ts#L8)
