---
title: VerifyArgs
sidebar_label: VerifyArgs
---

Interface for the arguments to the verifyProof command

## Table of contents

### Properties

- [maciAddress](VerifyArgs.md#maciaddress)
- [pollId](VerifyArgs.md#pollid)
- [quiet](VerifyArgs.md#quiet)
- [signer](VerifyArgs.md#signer)
- [subsidyAddress](VerifyArgs.md#subsidyaddress)
- [subsidyData](VerifyArgs.md#subsidydata)
- [subsidyEnabled](VerifyArgs.md#subsidyenabled)
- [tallyAddress](VerifyArgs.md#tallyaddress)
- [tallyData](VerifyArgs.md#tallydata)

## Properties

### maciAddress

• **maciAddress**: `string`

The address of the MACI contract

#### Defined in

[utils/interfaces.ts:1025](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L1025)

---

### pollId

• **pollId**: `bigint`

The id of the poll

#### Defined in

[utils/interfaces.ts:1005](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L1005)

---

### quiet

• `Optional` **quiet**: `boolean`

Whether to log the output

#### Defined in

[utils/interfaces.ts:1045](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L1045)

---

### signer

• **signer**: `Signer`

A signer object

#### Defined in

[utils/interfaces.ts:1015](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L1015)

---

### subsidyAddress

• `Optional` **subsidyAddress**: `string`

The address of the Subsidy contract

#### Defined in

[utils/interfaces.ts:1035](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L1035)

---

### subsidyData

• `Optional` **subsidyData**: [`SubsidyData`](SubsidyData.md)

The subsidy data

#### Defined in

[utils/interfaces.ts:1040](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L1040)

---

### subsidyEnabled

• **subsidyEnabled**: `boolean`

Whether to deploy subsidy contract

#### Defined in

[utils/interfaces.ts:1010](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L1010)

---

### tallyAddress

• **tallyAddress**: `string`

The address of the Tally contract

#### Defined in

[utils/interfaces.ts:1030](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L1030)

---

### tallyData

• **tallyData**: [`TallyData`](TallyData.md)

The tally data

#### Defined in

[utils/interfaces.ts:1020](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L1020)
