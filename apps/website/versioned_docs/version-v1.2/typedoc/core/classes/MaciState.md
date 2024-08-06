---
title: MaciState
sidebar_label: MaciState
---

A representation of the MACI contract.

## Implements

- `IMaciState`

## Table of contents

### Constructors

- [constructor](MaciState.md#constructor)

### Properties

- [currentPollBeingProcessed](MaciState.md#currentpollbeingprocessed)
- [numSignUps](MaciState.md#numsignups)
- [pollBeingProcessed](MaciState.md#pollbeingprocessed)
- [polls](MaciState.md#polls)
- [stateLeaves](MaciState.md#stateleaves)
- [stateTreeDepth](MaciState.md#statetreedepth)

### Methods

- [copy](MaciState.md#copy)
- [deployNullPoll](MaciState.md#deploynullpoll)
- [deployPoll](MaciState.md#deploypoll)
- [equals](MaciState.md#equals)
- [signUp](MaciState.md#signup)
- [toJSON](MaciState.md#tojson)
- [fromJSON](MaciState.md#fromjson)

## Constructors

### constructor

• **new MaciState**(`stateTreeDepth`): [`MaciState`](MaciState.md)

Constructs a new MaciState object.

#### Parameters

| Name             | Type     | Description                  |
| :--------------- | :------- | :--------------------------- |
| `stateTreeDepth` | `number` | The depth of the state tree. |

#### Returns

[`MaciState`](MaciState.md)

#### Defined in

[MaciState.ts:32](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L32)

## Properties

### currentPollBeingProcessed

• `Optional` **currentPollBeingProcessed**: `bigint`

#### Defined in

[MaciState.ts:26](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L26)

---

### numSignUps

• **numSignUps**: `number` = `0`

#### Defined in

[MaciState.ts:21](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L21)

---

### pollBeingProcessed

• `Optional` **pollBeingProcessed**: `boolean`

#### Defined in

[MaciState.ts:24](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L24)

---

### polls

• **polls**: `Map`\<`bigint`, [`Poll`](Poll.md)\>

#### Defined in

[MaciState.ts:13](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L13)

---

### stateLeaves

• **stateLeaves**: `StateLeaf`[] = `[]`

#### Defined in

[MaciState.ts:16](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L16)

---

### stateTreeDepth

• **stateTreeDepth**: `number`

#### Defined in

[MaciState.ts:19](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L19)

## Methods

### copy

▸ **copy**(): [`MaciState`](MaciState.md)

Create a deep copy of the MaciState object.

#### Returns

[`MaciState`](MaciState.md)

A new instance of the MaciState object with the same properties.

#### Implementation of

IMaciState.copy

#### Defined in

[MaciState.ts:100](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L100)

---

### deployNullPoll

▸ **deployNullPoll**(): `void`

Deploy a null poll.

#### Returns

`void`

#### Implementation of

IMaciState.deployNullPoll

#### Defined in

[MaciState.ts:92](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L92)

---

### deployPoll

▸ **deployPoll**(`pollEndTimestamp`, `maxValues`, `treeDepths`, `messageBatchSize`, `coordinatorKeypair`): `bigint`

Deploy a new poll with the given parameters.

#### Parameters

| Name                 | Type                                        | Description                                        |
| :------------------- | :------------------------------------------ | :------------------------------------------------- |
| `pollEndTimestamp`   | `bigint`                                    | The Unix timestamp at which the poll ends.         |
| `maxValues`          | [`MaxValues`](../interfaces/MaxValues.md)   | The maximum number of values for each vote option. |
| `treeDepths`         | [`TreeDepths`](../interfaces/TreeDepths.md) | The depths of the tree.                            |
| `messageBatchSize`   | `number`                                    | The batch size for processing messages.            |
| `coordinatorKeypair` | `Keypair`                                   | The keypair of the MACI round coordinator.         |

#### Returns

`bigint`

The index of the newly deployed poll.

#### Implementation of

IMaciState.deployPoll

#### Defined in

[MaciState.ts:65](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L65)

---

### equals

▸ **equals**(`m`): `boolean`

Check if the MaciState object is equal to another MaciState object.

#### Parameters

| Name | Type                        | Description                      |
| :--- | :-------------------------- | :------------------------------- |
| `m`  | [`MaciState`](MaciState.md) | The MaciState object to compare. |

#### Returns

`boolean`

True if the two MaciState objects are equal, false otherwise.

#### Implementation of

IMaciState.equals

#### Defined in

[MaciState.ts:115](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L115)

---

### signUp

▸ **signUp**(`pubKey`, `initialVoiceCreditBalance`, `timestamp`): `number`

Sign up a user with the given public key, initial voice credit balance, and timestamp.

#### Parameters

| Name                        | Type     | Description                                   |
| :-------------------------- | :------- | :-------------------------------------------- |
| `pubKey`                    | `PubKey` | The public key of the user.                   |
| `initialVoiceCreditBalance` | `bigint` | The initial voice credit balance of the user. |
| `timestamp`                 | `bigint` | The timestamp of the sign-up.                 |

#### Returns

`number`

The index of the newly signed-up user in the state tree.

#### Implementation of

IMaciState.signUp

#### Defined in

[MaciState.ts:49](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L49)

---

### toJSON

▸ **toJSON**(): [`IJsonMaciState`](../interfaces/IJsonMaciState.md)

Serialize the MaciState object to a JSON object.

#### Returns

[`IJsonMaciState`](../interfaces/IJsonMaciState.md)

A JSON object representing the MaciState object.

#### Implementation of

IMaciState.toJSON

#### Defined in

[MaciState.ts:143](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L143)

---

### fromJSON

▸ **fromJSON**(`json`): [`MaciState`](MaciState.md)

Create a new MaciState object from a JSON object.

#### Parameters

| Name   | Type                                                | Description                                        |
| :----- | :-------------------------------------------------- | :------------------------------------------------- |
| `json` | [`IJsonMaciState`](../interfaces/IJsonMaciState.md) | The JSON object representing the MaciState object. |

#### Returns

[`MaciState`](MaciState.md)

A new instance of the MaciState object with the properties from the JSON object.

#### Defined in

[MaciState.ts:159](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/MaciState.ts#L159)
