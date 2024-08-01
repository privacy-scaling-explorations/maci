---
title: GenProofsArgs
sidebar_label: GenProofsArgs
---

Interface for the arguments to the genProof command

## Table of contents

### Properties

- [blocksPerBatch](GenProofsArgs.md#blocksperbatch)
- [coordinatorPrivKey](GenProofsArgs.md#coordinatorprivkey)
- [endBlock](GenProofsArgs.md#endblock)
- [maciAddress](GenProofsArgs.md#maciaddress)
- [outputDir](GenProofsArgs.md#outputdir)
- [pollId](GenProofsArgs.md#pollid)
- [processDatFile](GenProofsArgs.md#processdatfile)
- [processWasm](GenProofsArgs.md#processwasm)
- [processWitgen](GenProofsArgs.md#processwitgen)
- [processZkey](GenProofsArgs.md#processzkey)
- [quiet](GenProofsArgs.md#quiet)
- [rapidsnark](GenProofsArgs.md#rapidsnark)
- [signer](GenProofsArgs.md#signer)
- [startBlock](GenProofsArgs.md#startblock)
- [stateFile](GenProofsArgs.md#statefile)
- [subsidyDatFile](GenProofsArgs.md#subsidydatfile)
- [subsidyFile](GenProofsArgs.md#subsidyfile)
- [subsidyWasm](GenProofsArgs.md#subsidywasm)
- [subsidyWitgen](GenProofsArgs.md#subsidywitgen)
- [subsidyZkey](GenProofsArgs.md#subsidyzkey)
- [tallyAddress](GenProofsArgs.md#tallyaddress)
- [tallyDatFile](GenProofsArgs.md#tallydatfile)
- [tallyFile](GenProofsArgs.md#tallyfile)
- [tallyWasm](GenProofsArgs.md#tallywasm)
- [tallyWitgen](GenProofsArgs.md#tallywitgen)
- [tallyZkey](GenProofsArgs.md#tallyzkey)
- [transactionHash](GenProofsArgs.md#transactionhash)
- [useQuadraticVoting](GenProofsArgs.md#usequadraticvoting)
- [useWasm](GenProofsArgs.md#usewasm)

## Properties

### blocksPerBatch

• `Optional` **blocksPerBatch**: `number`

The number of blocks to fetch logs from

#### Defined in

[utils/interfaces.ts:575](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L575)

---

### coordinatorPrivKey

• `Optional` **coordinatorPrivKey**: `string`

The coordinator's private key

#### Defined in

[utils/interfaces.ts:530](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L530)

---

### endBlock

• `Optional` **endBlock**: `number`

The block number to stop fetching logs from

#### Defined in

[utils/interfaces.ts:580](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L580)

---

### maciAddress

• `Optional` **maciAddress**: `string`

The address of the MACI contract

#### Defined in

[utils/interfaces.ts:535](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L535)

---

### outputDir

• **outputDir**: `string`

The directory to store the proofs

#### Defined in

[utils/interfaces.ts:455](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L455)

---

### pollId

• **pollId**: `bigint`

The id of the poll

#### Defined in

[utils/interfaces.ts:475](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L475)

---

### processDatFile

• `Optional` **processDatFile**: `string`

The path to the process dat file

#### Defined in

[utils/interfaces.ts:505](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L505)

---

### processWasm

• `Optional` **processWasm**: `string`

The path to the process wasm file

#### Defined in

[utils/interfaces.ts:545](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L545)

---

### processWitgen

• `Optional` **processWitgen**: `string`

The path to the process witnessgen binary

#### Defined in

[utils/interfaces.ts:500](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L500)

---

### processZkey

• **processZkey**: `string`

The path to the process zkey file

#### Defined in

[utils/interfaces.ts:470](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L470)

---

### quiet

• `Optional` **quiet**: `boolean`

Whether to log the output

#### Defined in

[utils/interfaces.ts:585](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L585)

---

### rapidsnark

• `Optional` **rapidsnark**: `string`

The path to the rapidsnark binary

#### Defined in

[utils/interfaces.ts:495](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L495)

---

### signer

• **signer**: `Signer`

A signer object

#### Defined in

[utils/interfaces.ts:480](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L480)

---

### startBlock

• `Optional` **startBlock**: `number`

The block number to start fetching logs from

#### Defined in

[utils/interfaces.ts:570](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L570)

---

### stateFile

• `Optional` **stateFile**: `string`

The file with the serialized maci state

#### Defined in

[utils/interfaces.ts:565](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L565)

---

### subsidyDatFile

• `Optional` **subsidyDatFile**: `string`

The path to the subsidy dat file

#### Defined in

[utils/interfaces.ts:525](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L525)

---

### subsidyFile

• `Optional` **subsidyFile**: `string`

The file to store the subsidy proof

#### Defined in

[utils/interfaces.ts:485](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L485)

---

### subsidyWasm

• `Optional` **subsidyWasm**: `string`

The path to the subsidy wasm file

#### Defined in

[utils/interfaces.ts:555](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L555)

---

### subsidyWitgen

• `Optional` **subsidyWitgen**: `string`

The path to the subsidy witnessgen binary

#### Defined in

[utils/interfaces.ts:520](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L520)

---

### subsidyZkey

• `Optional` **subsidyZkey**: `string`

The path to the subsidy zkey file

#### Defined in

[utils/interfaces.ts:490](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L490)

---

### tallyAddress

• `Optional` **tallyAddress**: `string`

The address of the Tally contract

#### Defined in

[utils/interfaces.ts:595](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L595)

---

### tallyDatFile

• `Optional` **tallyDatFile**: `string`

The path to the tally dat file

#### Defined in

[utils/interfaces.ts:515](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L515)

---

### tallyFile

• **tallyFile**: `string`

The file to store the tally proof

#### Defined in

[utils/interfaces.ts:460](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L460)

---

### tallyWasm

• `Optional` **tallyWasm**: `string`

The path to the tally wasm file

#### Defined in

[utils/interfaces.ts:550](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L550)

---

### tallyWitgen

• `Optional` **tallyWitgen**: `string`

The path to the tally witnessgen binary

#### Defined in

[utils/interfaces.ts:510](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L510)

---

### tallyZkey

• **tallyZkey**: `string`

The path to the tally zkey file

#### Defined in

[utils/interfaces.ts:465](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L465)

---

### transactionHash

• `Optional` **transactionHash**: `string`

The transaction hash of the first transaction

#### Defined in

[utils/interfaces.ts:540](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L540)

---

### useQuadraticVoting

• `Optional` **useQuadraticVoting**: `boolean`

Whether to use quadratic voting or not

#### Defined in

[utils/interfaces.ts:590](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L590)

---

### useWasm

• `Optional` **useWasm**: `boolean`

Whether to use wasm or rapidsnark

#### Defined in

[utils/interfaces.ts:560](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L560)
