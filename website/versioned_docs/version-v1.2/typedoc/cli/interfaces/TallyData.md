---
title: TallyData
sidebar_label: TallyData
---

Interface for the tally file data.

## Table of contents

### Properties

- [chainId](TallyData.md#chainid)
- [isQuadratic](TallyData.md#isquadratic)
- [maci](TallyData.md#maci)
- [network](TallyData.md#network)
- [newTallyCommitment](TallyData.md#newtallycommitment)
- [perVOSpentVoiceCredits](TallyData.md#pervospentvoicecredits)
- [pollId](TallyData.md#pollid)
- [results](TallyData.md#results)
- [tallyAddress](TallyData.md#tallyaddress)
- [totalSpentVoiceCredits](TallyData.md#totalspentvoicecredits)

## Properties

### chainId

• `Optional` **chainId**: `string`

The chain ID for which these proofs are valid for

#### Defined in

[utils/interfaces.ts:51](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L51)

---

### isQuadratic

• **isQuadratic**: `boolean`

Whether the poll is using quadratic voting or not.

#### Defined in

[utils/interfaces.ts:56](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L56)

---

### maci

• **maci**: `string`

The MACI address.

#### Defined in

[utils/interfaces.ts:35](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L35)

---

### network

• `Optional` **network**: `string`

The name of the network for which these proofs
are valid for

#### Defined in

[utils/interfaces.ts:46](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L46)

---

### newTallyCommitment

• **newTallyCommitment**: `string`

The new tally commitment.

#### Defined in

[utils/interfaces.ts:66](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L66)

---

### perVOSpentVoiceCredits

• `Optional` **perVOSpentVoiceCredits**: `Object`

The per VO spent voice credits.

#### Type declaration

| Name         | Type       | Description                                       |
| :----------- | :--------- | :------------------------------------------------ |
| `commitment` | `string`   | The commitment of the per VO spent voice credits. |
| `salt`       | `string`   | The salt of the per VO spent voice credits.       |
| `tally`      | `string`[] | The tally of the per VO spent voice credits.      |

#### Defined in

[utils/interfaces.ts:111](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L111)

---

### pollId

• **pollId**: `string`

The ID of the poll.

#### Defined in

[utils/interfaces.ts:40](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L40)

---

### results

• **results**: `Object`

The results of the poll.

#### Type declaration

| Name         | Type       | Description                    |
| :----------- | :--------- | :----------------------------- |
| `commitment` | `string`   | The commitment of the results. |
| `salt`       | `string`   | The salt of the results.       |
| `tally`      | `string`[] | The tally of the results.      |

#### Defined in

[utils/interfaces.ts:71](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L71)

---

### tallyAddress

• **tallyAddress**: `string`

The address of the Tally contract.

#### Defined in

[utils/interfaces.ts:61](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L61)

---

### totalSpentVoiceCredits

• **totalSpentVoiceCredits**: `Object`

The total spent voice credits.

#### Type declaration

| Name         | Type     | Description                                |
| :----------- | :------- | :----------------------------------------- |
| `commitment` | `string` | The commitment of the spent voice credits. |
| `salt`       | `string` | The salt of the spent voice credits.       |
| `spent`      | `string` | The spent voice credits.                   |

#### Defined in

[utils/interfaces.ts:91](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L91)
