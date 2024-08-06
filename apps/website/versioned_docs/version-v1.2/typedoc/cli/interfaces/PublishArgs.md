---
title: PublishArgs
sidebar_label: PublishArgs
---

Interface for the arguments to the publish command

## Table of contents

### Properties

- [maciContractAddress](PublishArgs.md#macicontractaddress)
- [newVoteWeight](PublishArgs.md#newvoteweight)
- [nonce](PublishArgs.md#nonce)
- [pollId](PublishArgs.md#pollid)
- [privateKey](PublishArgs.md#privatekey)
- [pubkey](PublishArgs.md#pubkey)
- [quiet](PublishArgs.md#quiet)
- [salt](PublishArgs.md#salt)
- [signer](PublishArgs.md#signer)
- [stateIndex](PublishArgs.md#stateindex)
- [voteOptionIndex](PublishArgs.md#voteoptionindex)

## Properties

### maciContractAddress

• **maciContractAddress**: `string`

The address of the MACI contract

#### Defined in

[utils/interfaces.ts:750](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L750)

---

### newVoteWeight

• **newVoteWeight**: `bigint`

The new vote weight

#### Defined in

[utils/interfaces.ts:740](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L740)

---

### nonce

• **nonce**: `bigint`

The nonce of the message

#### Defined in

[utils/interfaces.ts:730](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L730)

---

### pollId

• **pollId**: `bigint`

The id of the poll

#### Defined in

[utils/interfaces.ts:735](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L735)

---

### privateKey

• **privateKey**: `string`

The private key of the user

#### Defined in

[utils/interfaces.ts:755](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L755)

---

### pubkey

• **pubkey**: `string`

The public key of the user

#### Defined in

[utils/interfaces.ts:715](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L715)

---

### quiet

• `Optional` **quiet**: `boolean`

Whether to log the output

#### Defined in

[utils/interfaces.ts:765](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L765)

---

### salt

• `Optional` **salt**: `bigint`

The salt of the message

#### Defined in

[utils/interfaces.ts:760](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L760)

---

### signer

• **signer**: `Signer`

A signer object

#### Defined in

[utils/interfaces.ts:745](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L745)

---

### stateIndex

• **stateIndex**: `bigint`

The index of the state leaf

#### Defined in

[utils/interfaces.ts:720](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L720)

---

### voteOptionIndex

• **voteOptionIndex**: `bigint`

The index of the vote option

#### Defined in

[utils/interfaces.ts:725](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L725)
