---
title: GenLocalStateArgs
sidebar_label: GenLocalStateArgs
---

Interface for the arguments to the genLocalState command
Generate a local MACI state from the smart contracts events

## Table of contents

### Properties

- [blockPerBatch](GenLocalStateArgs.md#blockperbatch)
- [coordinatorPrivateKey](GenLocalStateArgs.md#coordinatorprivatekey)
- [endBlock](GenLocalStateArgs.md#endblock)
- [ethereumProvider](GenLocalStateArgs.md#ethereumprovider)
- [maciContractAddress](GenLocalStateArgs.md#macicontractaddress)
- [outputPath](GenLocalStateArgs.md#outputpath)
- [pollId](GenLocalStateArgs.md#pollid)
- [quiet](GenLocalStateArgs.md#quiet)
- [signer](GenLocalStateArgs.md#signer)
- [sleep](GenLocalStateArgs.md#sleep)
- [startBlock](GenLocalStateArgs.md#startblock)
- [transactionHash](GenLocalStateArgs.md#transactionhash)

## Properties

### blockPerBatch

• `Optional` **blockPerBatch**: `number`

The number of blocks to fetch per batch

#### Defined in

[utils/interfaces.ts:430](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L430)

---

### coordinatorPrivateKey

• `Optional` **coordinatorPrivateKey**: `string`

The private key of the MACI coordinator

#### Defined in

[utils/interfaces.ts:410](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L410)

---

### endBlock

• `Optional` **endBlock**: `number`

The end block number

#### Defined in

[utils/interfaces.ts:420](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L420)

---

### ethereumProvider

• `Optional` **ethereumProvider**: `string`

The ethereum provider

#### Defined in

[utils/interfaces.ts:415](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L415)

---

### maciContractAddress

• `Optional` **maciContractAddress**: `string`

The address of the MACI contract

#### Defined in

[utils/interfaces.ts:405](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L405)

---

### outputPath

• **outputPath**: `string`

The path where to write the state

#### Defined in

[utils/interfaces.ts:390](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L390)

---

### pollId

• **pollId**: `bigint`

The id of the poll

#### Defined in

[utils/interfaces.ts:395](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L395)

---

### quiet

• `Optional` **quiet**: `boolean`

Whether to log the output

#### Defined in

[utils/interfaces.ts:445](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L445)

---

### signer

• **signer**: `Signer`

A signer object

#### Defined in

[utils/interfaces.ts:400](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L400)

---

### sleep

• `Optional` **sleep**: `number`

The sleep time between batches

#### Defined in

[utils/interfaces.ts:440](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L440)

---

### startBlock

• `Optional` **startBlock**: `number`

The start block number

#### Defined in

[utils/interfaces.ts:425](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L425)

---

### transactionHash

• `Optional` **transactionHash**: `string`

The transaction hash

#### Defined in

[utils/interfaces.ts:435](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L435)
