---
title: PCommand
sidebar_label: PCommand
---

**`Notice`**

Unencrypted data whose fields include the user's public key, vote etc.
This represents a Vote command.

## Implements

- [`ICommand`](../interfaces/ICommand.md)

## Table of contents

### Constructors

- [constructor](PCommand.md#constructor)

### Properties

- [cmdType](PCommand.md#cmdtype)
- [newPubKey](PCommand.md#newpubkey)
- [newVoteWeight](PCommand.md#newvoteweight)
- [nonce](PCommand.md#nonce)
- [pollId](PCommand.md#pollid)
- [salt](PCommand.md#salt)
- [stateIndex](PCommand.md#stateindex)
- [voteOptionIndex](PCommand.md#voteoptionindex)

### Methods

- [asArray](PCommand.md#asarray)
- [asCircuitInputs](PCommand.md#ascircuitinputs)
- [copy](PCommand.md#copy)
- [encrypt](PCommand.md#encrypt)
- [equals](PCommand.md#equals)
- [hash](PCommand.md#hash)
- [sign](PCommand.md#sign)
- [toJSON](PCommand.md#tojson)
- [verifySignature](PCommand.md#verifysignature)
- [decrypt](PCommand.md#decrypt)
- [fromJSON](PCommand.md#fromjson)

## Constructors

### constructor

• **new PCommand**(`stateIndex`, `newPubKey`, `voteOptionIndex`, `newVoteWeight`, `nonce`, `pollId`, `salt?`): [`PCommand`](PCommand.md)

Create a new PCommand

#### Parameters

| Name              | Type                  | Description                     |
| :---------------- | :-------------------- | :------------------------------ |
| `stateIndex`      | `bigint`              | the state index of the user     |
| `newPubKey`       | [`PubKey`](PubKey.md) | the new public key of the user  |
| `voteOptionIndex` | `bigint`              | the index of the vote option    |
| `newVoteWeight`   | `bigint`              | the new vote weight of the user |
| `nonce`           | `bigint`              | the nonce of the message        |
| `pollId`          | `bigint`              | the poll ID                     |
| `salt`            | `bigint`              | the salt of the message         |

#### Returns

[`PCommand`](PCommand.md)

#### Defined in

[commands/PCommand.ts:59](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L59)

## Properties

### cmdType

• **cmdType**: `bigint`

#### Implementation of

[ICommand](../interfaces/ICommand.md).[cmdType](../interfaces/ICommand.md#cmdtype)

#### Defined in

[commands/PCommand.ts:33](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L33)

---

### newPubKey

• **newPubKey**: [`PubKey`](PubKey.md)

#### Defined in

[commands/PCommand.ts:37](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L37)

---

### newVoteWeight

• **newVoteWeight**: `bigint`

#### Defined in

[commands/PCommand.ts:41](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L41)

---

### nonce

• **nonce**: `bigint`

#### Defined in

[commands/PCommand.ts:43](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L43)

---

### pollId

• **pollId**: `bigint`

#### Defined in

[commands/PCommand.ts:45](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L45)

---

### salt

• **salt**: `bigint`

#### Defined in

[commands/PCommand.ts:47](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L47)

---

### stateIndex

• **stateIndex**: `bigint`

#### Defined in

[commands/PCommand.ts:35](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L35)

---

### voteOptionIndex

• **voteOptionIndex**: `bigint`

#### Defined in

[commands/PCommand.ts:39](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L39)

## Methods

### asArray

▸ **asArray**(): `bigint`[]

#### Returns

`bigint`[]

bigint[] - the command as an array

**`Notice`**

Returns this Command as an array. Note that 5 of the Command's fields
are packed into a single 250-bit value. This allows Messages to be
smaller and thereby save gas when the user publishes a message.

#### Defined in

[commands/PCommand.ts:107](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L107)

---

### asCircuitInputs

▸ **asCircuitInputs**(): `bigint`[]

#### Returns

`bigint`[]

#### Defined in

[commands/PCommand.ts:123](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L123)

---

### copy

▸ **copy**\<`T`\>(): `T`

Create a deep clone of this PCommand

#### Type parameters

| Name | Type                              |
| :--- | :-------------------------------- |
| `T`  | extends [`PCommand`](PCommand.md) |

#### Returns

`T`

a copy of the PCommand

#### Implementation of

[ICommand](../interfaces/ICommand.md).[copy](../interfaces/ICommand.md#copy)

#### Defined in

[commands/PCommand.ts:90](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L90)

---

### encrypt

▸ **encrypt**(`signature`, `sharedKey`): [`Message`](Message.md)

#### Parameters

| Name        | Type                            |
| :---------- | :------------------------------ |
| `signature` | `Signature`\<`SnarkBigNumber`\> |
| `sharedKey` | `EcdhSharedKey`                 |

#### Returns

[`Message`](Message.md)

**`Notice`**

Encrypts this command along with a signature to produce a Message.
To save gas, we can constrain the following values to 50 bits and pack
them into a 250-bit value: 0. state index 3. vote option index 4. new vote weight 5. nonce 6. poll ID

#### Defined in

[commands/PCommand.ts:162](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L162)

---

### equals

▸ **equals**(`command`): `boolean`

#### Parameters

| Name      | Type                      |
| :-------- | :------------------------ |
| `command` | [`PCommand`](PCommand.md) |

#### Returns

`boolean`

#### Implementation of

[ICommand](../interfaces/ICommand.md).[equals](../interfaces/ICommand.md#equals)

#### Defined in

[commands/PCommand.ts:128](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L128)

---

### hash

▸ **hash**(): `bigint`

#### Returns

`bigint`

#### Defined in

[commands/PCommand.ts:137](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L137)

---

### sign

▸ **sign**(`privKey`): `Signature`\<`SnarkBigNumber`\>

#### Parameters

| Name      | Type                    |
| :-------- | :---------------------- |
| `privKey` | [`PrivKey`](PrivKey.md) |

#### Returns

`Signature`\<`SnarkBigNumber`\>

**`Notice`**

Signs this command and returns a Signature.

#### Defined in

[commands/PCommand.ts:142](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L142)

---

### toJSON

▸ **toJSON**(): [`IJsonPCommand`](../interfaces/IJsonPCommand.md)

Serialize into a JSON object

#### Returns

[`IJsonPCommand`](../interfaces/IJsonPCommand.md)

#### Implementation of

[ICommand](../interfaces/ICommand.md).[toJSON](../interfaces/ICommand.md#tojson)

#### Defined in

[commands/PCommand.ts:226](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L226)

---

### verifySignature

▸ **verifySignature**(`signature`, `pubKey`): `boolean`

#### Parameters

| Name        | Type                            |
| :---------- | :------------------------------ |
| `signature` | `Signature`\<`SnarkBigNumber`\> |
| `pubKey`    | [`PubKey`](PubKey.md)           |

#### Returns

`boolean`

**`Notice`**

Returns true if the given signature is a correct signature of this
command and signed by the private key associated with the given public
key.

#### Defined in

[commands/PCommand.ts:149](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L149)

---

### decrypt

▸ **decrypt**(`message`, `sharedKey`, `force?`): `IDecryptMessage`

Decrypts a Message to produce a Command.

#### Parameters

| Name        | Type                    | Default value | Description                          |
| :---------- | :---------------------- | :------------ | :----------------------------------- |
| `message`   | [`Message`](Message.md) | `undefined`   | the message to decrypt               |
| `sharedKey` | `EcdhSharedKey`         | `undefined`   | the shared key to use for decryption |
| `force`     | `boolean`               | `false`       | whether to force decryption or not   |

#### Returns

`IDecryptMessage`

**`Dev`**

You can force decrypt the message by setting `force` to true.
This is useful in case you don't want an invalid message to throw an error.

#### Defined in

[commands/PCommand.ts:182](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L182)

---

### fromJSON

▸ **fromJSON**(`json`): [`PCommand`](PCommand.md)

Deserialize into a PCommand instance

#### Parameters

| Name   | Type                                              |
| :----- | :------------------------------------------------ |
| `json` | [`IJsonPCommand`](../interfaces/IJsonPCommand.md) |

#### Returns

[`PCommand`](PCommand.md)

a PCommand instance

#### Defined in

[commands/PCommand.ts:244](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/commands/PCommand.ts#L244)
