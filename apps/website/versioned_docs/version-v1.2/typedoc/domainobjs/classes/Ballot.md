---
title: Ballot
sidebar_label: Ballot
---

A Ballot represents a User's votes in a Poll, as well as their next valid
nonce.

## Table of contents

### Constructors

- [constructor](Ballot.md#constructor)

### Properties

- [nonce](Ballot.md#nonce)
- [voteOptionTreeDepth](Ballot.md#voteoptiontreedepth)
- [votes](Ballot.md#votes)

### Methods

- [asArray](Ballot.md#asarray)
- [asCircuitInputs](Ballot.md#ascircuitinputs)
- [copy](Ballot.md#copy)
- [equals](Ballot.md#equals)
- [hash](Ballot.md#hash)
- [toJSON](Ballot.md#tojson)
- [fromJSON](Ballot.md#fromjson)
- [genBlankBallot](Ballot.md#genblankballot)
- [genRandomBallot](Ballot.md#genrandomballot)

## Constructors

### constructor

• **new Ballot**(`_numVoteOptions`, `_voteOptionTreeDepth`): [`Ballot`](Ballot.md)

Create a new Ballot instance

#### Parameters

| Name                   | Type     | Description                                           |
| :--------------------- | :------- | :---------------------------------------------------- |
| `_numVoteOptions`      | `number` | How many vote options are available in the poll       |
| `_voteOptionTreeDepth` | `number` | The depth of the merkle tree holding the vote options |

#### Returns

[`Ballot`](Ballot.md)

#### Defined in

[ballot.ts:23](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L23)

## Properties

### nonce

• **nonce**: `bigint`

#### Defined in

[ballot.ts:14](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L14)

---

### voteOptionTreeDepth

• **voteOptionTreeDepth**: `number`

#### Defined in

[ballot.ts:16](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L16)

---

### votes

• **votes**: `bigint`[] = `[]`

#### Defined in

[ballot.ts:12](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L12)

## Methods

### asArray

▸ **asArray**(): `bigint`[]

Convert in a an array of bigints

#### Returns

`bigint`[]

the ballot as a bigint array

**`Notice`**

this is the nonce and the root of the vote option tree

#### Defined in

[ballot.ts:52](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L52)

---

### asCircuitInputs

▸ **asCircuitInputs**(): `bigint`[]

Convert in a format suitable for the circuit

#### Returns

`bigint`[]

the ballot as a BigInt array

#### Defined in

[ballot.ts:45](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L45)

---

### copy

▸ **copy**(): [`Ballot`](Ballot.md)

Create a deep clone of this Ballot

#### Returns

[`Ballot`](Ballot.md)

a copy of the ballot

#### Defined in

[ballot.ts:68](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L68)

---

### equals

▸ **equals**(`b`): `boolean`

Check if two ballots are equal (same votes and same nonce)

#### Parameters

| Name | Type                  | Description                |
| :--- | :-------------------- | :------------------------- |
| `b`  | [`Ballot`](Ballot.md) | The ballot to compare with |

#### Returns

`boolean`

whether the two ballots are equal

#### Defined in

[ballot.ts:81](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L81)

---

### hash

▸ **hash**(): `bigint`

Generate an hash of this ballot

#### Returns

`bigint`

The hash of the ballot

#### Defined in

[ballot.ts:36](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L36)

---

### toJSON

▸ **toJSON**(): [`IJsonBallot`](../interfaces/IJsonBallot.md)

Serialize to a JSON object

#### Returns

[`IJsonBallot`](../interfaces/IJsonBallot.md)

#### Defined in

[ballot.ts:112](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L112)

---

### fromJSON

▸ **fromJSON**(`json`): [`Ballot`](Ballot.md)

Deserialize into a Ballot instance

#### Parameters

| Name   | Type                                          | Description             |
| :----- | :-------------------------------------------- | :---------------------- |
| `json` | [`IJsonBallot`](../interfaces/IJsonBallot.md) | the json representation |

#### Returns

[`Ballot`](Ballot.md)

the deserialized object as a Ballot instance

#### Defined in

[ballot.ts:125](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L125)

---

### genBlankBallot

▸ **genBlankBallot**(`numVoteOptions`, `voteOptionTreeDepth`): [`Ballot`](Ballot.md)

Generate a blank ballot

#### Parameters

| Name                  | Type     | Description                                          |
| :-------------------- | :------- | :--------------------------------------------------- |
| `numVoteOptions`      | `number` | How many vote options are available                  |
| `voteOptionTreeDepth` | `number` | How deep is the merkle tree holding the vote options |

#### Returns

[`Ballot`](Ballot.md)

a Blank Ballot object

#### Defined in

[ballot.ts:104](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L104)

---

### genRandomBallot

▸ **genRandomBallot**(`numVoteOptions`, `voteOptionTreeDepth`): [`Ballot`](Ballot.md)

Generate a random ballot

#### Parameters

| Name                  | Type     | Description                                          |
| :-------------------- | :------- | :--------------------------------------------------- |
| `numVoteOptions`      | `number` | How many vote options are available                  |
| `voteOptionTreeDepth` | `number` | How deep is the merkle tree holding the vote options |

#### Returns

[`Ballot`](Ballot.md)

a random Ballot

#### Defined in

[ballot.ts:92](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/ballot.ts#L92)
