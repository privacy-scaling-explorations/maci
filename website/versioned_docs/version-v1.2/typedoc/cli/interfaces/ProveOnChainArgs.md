---
title: ProveOnChainArgs
sidebar_label: ProveOnChainArgs
---

Interface for the arguments to the ProveOnChainArgs command

## Table of contents

### Properties

- [maciAddress](ProveOnChainArgs.md#maciaddress)
- [messageProcessorAddress](ProveOnChainArgs.md#messageprocessoraddress)
- [pollId](ProveOnChainArgs.md#pollid)
- [proofDir](ProveOnChainArgs.md#proofdir)
- [quiet](ProveOnChainArgs.md#quiet)
- [signer](ProveOnChainArgs.md#signer)
- [subsidyAddress](ProveOnChainArgs.md#subsidyaddress)
- [subsidyEnabled](ProveOnChainArgs.md#subsidyenabled)
- [tallyAddress](ProveOnChainArgs.md#tallyaddress)

## Properties

### maciAddress

• `Optional` **maciAddress**: `string`

The address of the MACI contract

#### Defined in

[utils/interfaces.ts:685](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L685)

---

### messageProcessorAddress

• `Optional` **messageProcessorAddress**: `string`

The address of the MessageProcessor contract

#### Defined in

[utils/interfaces.ts:690](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L690)

---

### pollId

• **pollId**: `bigint`

The id of the poll

#### Defined in

[utils/interfaces.ts:665](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L665)

---

### proofDir

• **proofDir**: `string`

The directory containing the proofs

#### Defined in

[utils/interfaces.ts:670](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L670)

---

### quiet

• `Optional` **quiet**: `boolean`

Whether to log the output

#### Defined in

[utils/interfaces.ts:705](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L705)

---

### signer

• **signer**: `Signer`

A signer object

#### Defined in

[utils/interfaces.ts:680](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L680)

---

### subsidyAddress

• `Optional` **subsidyAddress**: `string`

The address of the Subsidy contract

#### Defined in

[utils/interfaces.ts:700](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L700)

---

### subsidyEnabled

• **subsidyEnabled**: `boolean`

Whether to deploy subsidy contract

#### Defined in

[utils/interfaces.ts:675](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L675)

---

### tallyAddress

• `Optional` **tallyAddress**: `string`

The address of the Tally contract

#### Defined in

[utils/interfaces.ts:695](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L695)
