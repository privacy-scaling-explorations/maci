---
title: Core Module
sidebar_label: module
sidebar_position: 1
---

## Table of contents

### Classes

- [MaciState](classes/MaciState.md)
- [Poll](classes/Poll.md)

### Interfaces

- [BatchSizes](interfaces/BatchSizes.md)
- [IJsonMaciState](interfaces/IJsonMaciState.md)
- [IProcessMessagesCircuitInputs](interfaces/IProcessMessagesCircuitInputs.md)
- [ISubsidyCircuitInputs](interfaces/ISubsidyCircuitInputs.md)
- [ITallyCircuitInputs](interfaces/ITallyCircuitInputs.md)
- [MaxValues](interfaces/MaxValues.md)
- [TreeDepths](interfaces/TreeDepths.md)

### Type Aliases

- [CircuitInputs](modules.md#circuitinputs)

### Variables

- [STATE_TREE_ARITY](modules.md#state_tree_arity)

### Functions

- [genProcessVkSig](modules.md#genprocessvksig)
- [genSubsidyVkSig](modules.md#gensubsidyvksig)
- [genTallyVkSig](modules.md#gentallyvksig)
- [packProcessMessageSmallVals](modules.md#packprocessmessagesmallvals)
- [packSubsidySmallVals](modules.md#packsubsidysmallvals)
- [packTallyVotesSmallVals](modules.md#packtallyvotessmallvals)
- [unpackProcessMessageSmallVals](modules.md#unpackprocessmessagesmallvals)
- [unpackTallyVotesSmallVals](modules.md#unpacktallyvotessmallvals)

## Type Aliases

### CircuitInputs

Ƭ **CircuitInputs**: `Record`\<`string`, `string` \| `bigint` \| `bigint`[] \| `bigint`[][] \| `string`[] \| `bigint`[][][]\>

A circuit inputs for the circom circuit

#### Defined in

[utils/types.ts:22](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/utils/types.ts#L22)

## Variables

### STATE_TREE_ARITY

• `Const` **STATE_TREE_ARITY**: `5`

#### Defined in

[utils/constants.ts:2](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/utils/constants.ts#L2)

## Functions

### genProcessVkSig

▸ **genProcessVkSig**(`stateTreeDepth`, `messageTreeDepth`, `voteOptionTreeDepth`, `batchSize`): `bigint`

This function generates the signature of a ProcessMessage Verifying Key(VK).
This can be used to check if a ProcessMessages' circuit VK is registered
in a smart contract that holds several VKs.

#### Parameters

| Name                  | Type     | Description                        |
| :-------------------- | :------- | :--------------------------------- |
| `stateTreeDepth`      | `number` | The depth of the state tree.       |
| `messageTreeDepth`    | `number` | The depth of the message tree.     |
| `voteOptionTreeDepth` | `number` | The depth of the vote option tree. |
| `batchSize`           | `number` | The size of the batch.             |

#### Returns

`bigint`

Returns a signature for querying if a verifying key with the given parameters is already registered in the contract.

#### Defined in

[utils/utils.ts:14](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/utils/utils.ts#L14)

---

### genSubsidyVkSig

▸ **genSubsidyVkSig**(`_stateTreeDepth`, `_intStateTreeDepth`, `_voteOptionTreeDepth`): `bigint`

This function generates the signature of a Subsidy Verifying Key(VK).
This can be used to check if a SubsidyCalculations' circuit VK is registered
in a smart contract that holds several VKs.

#### Parameters

| Name                   | Type     | Description                               |
| :--------------------- | :------- | :---------------------------------------- |
| `_stateTreeDepth`      | `number` | The depth of the state tree.              |
| `_intStateTreeDepth`   | `number` | The depth of the intermediate state tree. |
| `_voteOptionTreeDepth` | `number` | The depth of the vote option tree.        |

#### Returns

`bigint`

Returns a signature for querying if a verifying key with
the given parameters is already registered in the contract.

#### Defined in

[utils/utils.ts:51](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/utils/utils.ts#L51)

---

### genTallyVkSig

▸ **genTallyVkSig**(`_stateTreeDepth`, `_intStateTreeDepth`, `_voteOptionTreeDepth`): `bigint`

This function generates the signature of a Tally Verifying Key(VK).
This can be used to check if a TallyVotes' circuit VK is registered
in a smart contract that holds several VKs.

#### Parameters

| Name                   | Type     | Description                               |
| :--------------------- | :------- | :---------------------------------------- |
| `_stateTreeDepth`      | `number` | The depth of the state tree.              |
| `_intStateTreeDepth`   | `number` | The depth of the intermediate state tree. |
| `_voteOptionTreeDepth` | `number` | The depth of the vote option tree.        |

#### Returns

`bigint`

Returns a signature for querying if a verifying key with
the given parameters is already registered in the contract.

#### Defined in

[utils/utils.ts:35](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/utils/utils.ts#L35)

---

### packProcessMessageSmallVals

▸ **packProcessMessageSmallVals**(`maxVoteOptions`, `numUsers`, `batchStartIndex`, `batchEndIndex`): `bigint`

This function packs it's parameters into a single bigint.

#### Parameters

| Name              | Type     | Description                         |
| :---------------- | :------- | :---------------------------------- |
| `maxVoteOptions`  | `bigint` | The maximum number of vote options. |
| `numUsers`        | `bigint` | The number of users.                |
| `batchStartIndex` | `number` | The start index of the batch.       |
| `batchEndIndex`   | `number` | The end index of the batch.         |

#### Returns

`bigint`

Returns a single bigint that contains the packed values.

#### Defined in

[utils/utils.ts:65](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/utils/utils.ts#L65)

---

### packSubsidySmallVals

▸ **packSubsidySmallVals**(`row`, `col`, `numSignUps`): `bigint`

This function packs it's parameters into a single bigint.

#### Parameters

| Name         | Type     | Description            |
| :----------- | :------- | :--------------------- |
| `row`        | `number` | The row.               |
| `col`        | `number` | The column.            |
| `numSignUps` | `number` | The number of signups. |

#### Returns

`bigint`

Returns a single bigint that contains the packed values.

#### Defined in

[utils/utils.ts:150](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/utils/utils.ts#L150)

---

### packTallyVotesSmallVals

▸ **packTallyVotesSmallVals**(`batchStartIndex`, `batchSize`, `numSignUps`): `bigint`

This function packs it's parameters into a single bigint.

#### Parameters

| Name              | Type     | Description                   |
| :---------------- | :------- | :---------------------------- |
| `batchStartIndex` | `number` | The start index of the batch. |
| `batchSize`       | `number` | The size of the batch.        |
| `numSignUps`      | `number` | The number of signups.        |

#### Returns

`bigint`

Returns a single bigint that contains the packed values.

#### Defined in

[utils/utils.ts:119](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/utils/utils.ts#L119)

---

### unpackProcessMessageSmallVals

▸ **unpackProcessMessageSmallVals**(`packedVals`): `Object`

This function unpacks partial values for the ProcessMessages circuit from a single bigint.

#### Parameters

| Name         | Type     | Description                                        |
| :----------- | :------- | :------------------------------------------------- |
| `packedVals` | `bigint` | The single bigint that contains the packed values. |

#### Returns

`Object`

Returns an object that contains the unpacked values.

| Name              | Type     |
| :---------------- | :------- |
| `batchEndIndex`   | `bigint` |
| `batchStartIndex` | `bigint` |
| `maxVoteOptions`  | `bigint` |
| `numUsers`        | `bigint` |

#### Defined in

[utils/utils.ts:86](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/utils/utils.ts#L86)

---

### unpackTallyVotesSmallVals

▸ **unpackTallyVotesSmallVals**(`packedVals`): `Object`

This function unpacks partial values for the TallyVotes circuit from a single bigint.

#### Parameters

| Name         | Type     | Description                                        |
| :----------- | :------- | :------------------------------------------------- |
| `packedVals` | `bigint` | The single bigint that contains the packed values. |

#### Returns

`Object`

Returns an object that contains the unpacked values.

| Name              | Type     |
| :---------------- | :------- |
| `batchStartIndex` | `bigint` |
| `numSignUps`      | `bigint` |

#### Defined in

[utils/utils.ts:131](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/utils/utils.ts#L131)
