---
title: Poll
sidebar_label: Poll
---

A representation of the Poll contract.

## Implements

- `IPoll`

## Table of contents

### Constructors

- [constructor](Poll.md#constructor)

### Properties

- [MM](Poll.md#mm)
- [WW](Poll.md#ww)
- [ballotTree](Poll.md#ballottree)
- [ballots](Poll.md#ballots)
- [batchSizes](Poll.md#batchsizes)
- [cbi](Poll.md#cbi)
- [commands](Poll.md#commands)
- [coordinatorKeypair](Poll.md#coordinatorkeypair)
- [currentMessageBatchIndex](Poll.md#currentmessagebatchindex)
- [emptyBallot](Poll.md#emptyballot)
- [emptyBallotHash](Poll.md#emptyballothash)
- [encPubKeys](Poll.md#encpubkeys)
- [maciStateRef](Poll.md#macistateref)
- [maxValues](Poll.md#maxvalues)
- [messageTree](Poll.md#messagetree)
- [messages](Poll.md#messages)
- [numBatchesProcessed](Poll.md#numbatchesprocessed)
- [numBatchesTallied](Poll.md#numbatchestallied)
- [numSignups](Poll.md#numsignups)
- [perVOSpentVoiceCredits](Poll.md#pervospentvoicecredits)
- [pollEndTimestamp](Poll.md#pollendtimestamp)
- [pollId](Poll.md#pollid)
- [preVOSpentVoiceCreditsRootSalts](Poll.md#prevospentvoicecreditsrootsalts)
- [rbi](Poll.md#rbi)
- [resultRootSalts](Poll.md#resultrootsalts)
- [sbSalts](Poll.md#sbsalts)
- [spentVoiceCreditSubtotalSalts](Poll.md#spentvoicecreditsubtotalsalts)
- [stateCopied](Poll.md#statecopied)
- [stateLeaves](Poll.md#stateleaves)
- [stateTree](Poll.md#statetree)
- [stateTreeDepth](Poll.md#statetreedepth)
- [subsidy](Poll.md#subsidy)
- [subsidySalts](Poll.md#subsidysalts)
- [tallyResult](Poll.md#tallyresult)
- [totalSpentVoiceCredits](Poll.md#totalspentvoicecredits)
- [treeDepths](Poll.md#treedepths)

### Methods

- [coefficientCalculation](Poll.md#coefficientcalculation)
- [copy](Poll.md#copy)
- [equals](Poll.md#equals)
- [genPerVOSpentVoiceCreditsCommitment](Poll.md#genpervospentvoicecreditscommitment)
- [genProcessMessagesCircuitInputsPartial](Poll.md#genprocessmessagescircuitinputspartial)
- [genSpentVoiceCreditSubtotalCommitment](Poll.md#genspentvoicecreditsubtotalcommitment)
- [getNumSignups](Poll.md#getnumsignups)
- [hasUnfinishedSubsidyCalculation](Poll.md#hasunfinishedsubsidycalculation)
- [hasUnprocessedMessages](Poll.md#hasunprocessedmessages)
- [hasUntalliedBallots](Poll.md#hasuntalliedballots)
- [increaseSubsidyIndex](Poll.md#increasesubsidyindex)
- [previousSubsidyIndexToString](Poll.md#previoussubsidyindextostring)
- [processAllMessages](Poll.md#processallmessages)
- [processMessage](Poll.md#processmessage)
- [processMessages](Poll.md#processmessages)
- [publishMessage](Poll.md#publishmessage)
- [setCoordinatorKeypair](Poll.md#setcoordinatorkeypair)
- [setNumSignups](Poll.md#setnumsignups)
- [subsidyCalculation](Poll.md#subsidycalculation)
- [subsidyPerBatch](Poll.md#subsidyperbatch)
- [tallyVotes](Poll.md#tallyvotes)
- [tallyVotesNonQv](Poll.md#tallyvotesnonqv)
- [toJSON](Poll.md#tojson)
- [topupMessage](Poll.md#topupmessage)
- [updatePoll](Poll.md#updatepoll)
- [fromJSON](Poll.md#fromjson)

## Constructors

### constructor

• **new Poll**(`pollEndTimestamp`, `coordinatorKeypair`, `treeDepths`, `batchSizes`, `maxValues`, `maciStateRef`): [`Poll`](Poll.md)

Constructs a new Poll object.

#### Parameters

| Name                 | Type                                        | Description                                      |
| :------------------- | :------------------------------------------ | :----------------------------------------------- |
| `pollEndTimestamp`   | `bigint`                                    | The Unix timestamp at which the poll ends.       |
| `coordinatorKeypair` | `Keypair`                                   | The keypair of the coordinator.                  |
| `treeDepths`         | [`TreeDepths`](../interfaces/TreeDepths.md) | The depths of the trees used in the poll.        |
| `batchSizes`         | [`BatchSizes`](../interfaces/BatchSizes.md) | The sizes of the batches used in the poll.       |
| `maxValues`          | [`MaxValues`](../interfaces/MaxValues.md)   | The maximum values the MACI circuits can accept. |
| `maciStateRef`       | [`MaciState`](MaciState.md)                 | The reference to the MACI state.                 |

#### Returns

[`Poll`](Poll.md)

#### Defined in

[Poll.ts:146](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L146)

## Properties

### MM

• **MM**: `number` = `50`

#### Defined in

[Poll.ts:124](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L124)

---

### WW

• **WW**: `number` = `4`

#### Defined in

[Poll.ts:126](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L126)

---

### ballotTree

• `Optional` **ballotTree**: `IncrementalQuinTree`

#### Defined in

[Poll.ts:73](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L73)

---

### ballots

• **ballots**: `Ballot`[] = `[]`

#### Defined in

[Poll.ts:71](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L71)

---

### batchSizes

• **batchSizes**: [`BatchSizes`](../interfaces/BatchSizes.md)

#### Defined in

[Poll.ts:62](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L62)

---

### cbi

• **cbi**: `number` = `0`

#### Defined in

[Poll.ts:122](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L122)

---

### commands

• **commands**: `ICommand`[] = `[]`

#### Defined in

[Poll.ts:79](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L79)

---

### coordinatorKeypair

• **coordinatorKeypair**: `Keypair`

#### Defined in

[Poll.ts:58](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L58)

---

### currentMessageBatchIndex

• `Optional` **currentMessageBatchIndex**: `number`

#### Defined in

[Poll.ts:92](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L92)

---

### emptyBallot

• **emptyBallot**: `Ballot`

#### Defined in

[Poll.ts:130](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L130)

---

### emptyBallotHash

• `Optional` **emptyBallotHash**: `bigint`

#### Defined in

[Poll.ts:132](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L132)

---

### encPubKeys

• **encPubKeys**: `PubKey`[] = `[]`

#### Defined in

[Poll.ts:81](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L81)

---

### maciStateRef

• **maciStateRef**: [`MaciState`](MaciState.md)

#### Defined in

[Poll.ts:94](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L94)

---

### maxValues

• **maxValues**: [`MaxValues`](../interfaces/MaxValues.md)

#### Defined in

[Poll.ts:64](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L64)

---

### messageTree

• **messageTree**: `IncrementalQuinTree`

#### Defined in

[Poll.ts:77](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L77)

---

### messages

• **messages**: `Message`[] = `[]`

#### Defined in

[Poll.ts:75](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L75)

---

### numBatchesProcessed

• **numBatchesProcessed**: `number` = `0`

#### Defined in

[Poll.ts:90](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L90)

---

### numBatchesTallied

• **numBatchesTallied**: `number` = `0`

#### Defined in

[Poll.ts:111](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L111)

---

### numSignups

• `Private` **numSignups**: `bigint`

#### Defined in

[Poll.ts:135](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L135)

---

### perVOSpentVoiceCredits

• **perVOSpentVoiceCredits**: `bigint`[] = `[]`

#### Defined in

[Poll.ts:109](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L109)

---

### pollEndTimestamp

• **pollEndTimestamp**: `bigint`

#### Defined in

[Poll.ts:69](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L69)

---

### pollId

• **pollId**: `bigint`

#### Defined in

[Poll.ts:96](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L96)

---

### preVOSpentVoiceCreditsRootSalts

• **preVOSpentVoiceCreditsRootSalts**: `Record`\<`string` \| `number`, `bigint`\> = `{}`

#### Defined in

[Poll.ts:102](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L102)

---

### rbi

• **rbi**: `number` = `0`

#### Defined in

[Poll.ts:120](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L120)

---

### resultRootSalts

• **resultRootSalts**: `Record`\<`string` \| `number`, `bigint`\> = `{}`

#### Defined in

[Poll.ts:100](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L100)

---

### sbSalts

• **sbSalts**: `Record`\<`string` \| `number`, `bigint`\> = `{}`

#### Defined in

[Poll.ts:98](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L98)

---

### spentVoiceCreditSubtotalSalts

• **spentVoiceCreditSubtotalSalts**: `Record`\<`string` \| `number`, `bigint`\> = `{}`

#### Defined in

[Poll.ts:104](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L104)

---

### stateCopied

• **stateCopied**: `boolean` = `false`

#### Defined in

[Poll.ts:83](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L83)

---

### stateLeaves

• **stateLeaves**: `StateLeaf`[]

#### Defined in

[Poll.ts:85](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L85)

---

### stateTree

• `Optional` **stateTree**: `IncrementalQuinTree`

#### Defined in

[Poll.ts:87](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L87)

---

### stateTreeDepth

• **stateTreeDepth**: `number`

#### Defined in

[Poll.ts:67](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L67)

---

### subsidy

• **subsidy**: `bigint`[] = `[]`

#### Defined in

[Poll.ts:116](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L116)

---

### subsidySalts

• **subsidySalts**: `Record`\<`string` \| `number`, `bigint`\> = `{}`

#### Defined in

[Poll.ts:118](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L118)

---

### tallyResult

• **tallyResult**: `bigint`[] = `[]`

#### Defined in

[Poll.ts:107](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L107)

---

### totalSpentVoiceCredits

• **totalSpentVoiceCredits**: `bigint`

#### Defined in

[Poll.ts:113](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L113)

---

### treeDepths

• **treeDepths**: [`TreeDepths`](../interfaces/TreeDepths.md)

#### Defined in

[Poll.ts:60](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L60)

## Methods

### coefficientCalculation

▸ **coefficientCalculation**(`rowBallot`, `colBallot`): `bigint`

This method calculates the coefficient for a pair of ballots.

#### Parameters

| Name        | Type     | Description               |
| :---------- | :------- | :------------------------ |
| `rowBallot` | `Ballot` | The ballot in the row.    |
| `colBallot` | `Ballot` | The ballot in the column. |

#### Returns

`bigint`

Returns the calculated coefficient.

#### Defined in

[Poll.ts:1025](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1025)

---

### copy

▸ **copy**(): [`Poll`](Poll.md)

Create a deep copy of the Poll object.

#### Returns

[`Poll`](Poll.md)

A new instance of the Poll object with the same properties.

#### Implementation of

IPoll.copy

#### Defined in

[Poll.ts:1454](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1454)

---

### equals

▸ **equals**(`p`): `boolean`

Check if the Poll object is equal to another Poll object.

#### Parameters

| Name | Type              | Description                 |
| :--- | :---------------- | :-------------------------- |
| `p`  | [`Poll`](Poll.md) | The Poll object to compare. |

#### Returns

`boolean`

True if the two Poll objects are equal, false otherwise.

#### Implementation of

IPoll.equals

#### Defined in

[Poll.ts:1540](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1540)

---

### genPerVOSpentVoiceCreditsCommitment

▸ **genPerVOSpentVoiceCreditsCommitment**(`salt`, `numBallotsToCount`, `useQuadraticVoting?`): `bigint`

This method generates a commitment to the spent voice credits per vote option.

This is the hash of the Merkle root of the spent voice credits per vote option and a salt, computed as Poseidon([root, _salt]).

#### Parameters

| Name                 | Type      | Default value | Description                                              |
| :------------------- | :-------- | :------------ | :------------------------------------------------------- |
| `salt`               | `bigint`  | `undefined`   | The salt used in the hash function.                      |
| `numBallotsToCount`  | `number`  | `undefined`   | The number of ballots to count for the calculation.      |
| `useQuadraticVoting` | `boolean` | `true`        | Whether to use quadratic voting or not. Default is true. |

#### Returns

`bigint`

Returns the hash of the Merkle root of the spent voice credits per vote option and a salt, computed as Poseidon([root, _salt]).

#### Defined in

[Poll.ts:1428](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1428)

---

### genProcessMessagesCircuitInputsPartial

▸ **genProcessMessagesCircuitInputsPartial**(`index`): [`CircuitInputs`](../modules.md#circuitinputs)

Generates partial circuit inputs for processing a batch of messages

#### Parameters

| Name    | Type     | Description                     |
| :------ | :------- | :------------------------------ |
| `index` | `number` | The index of the partial batch. |

#### Returns

[`CircuitInputs`](../modules.md#circuitinputs)

stringified partial circuit inputs

#### Defined in

[Poll.ts:776](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L776)

---

### genSpentVoiceCreditSubtotalCommitment

▸ **genSpentVoiceCreditSubtotalCommitment**(`salt`, `numBallotsToCount`, `useQuadraticVoting?`): `bigint`

This method generates a commitment to the total spent voice credits.

This is the hash of the total spent voice credits and a salt, computed as Poseidon([totalCredits, _salt]).

#### Parameters

| Name                 | Type      | Default value | Description                                              |
| :------------------- | :-------- | :------------ | :------------------------------------------------------- |
| `salt`               | `bigint`  | `undefined`   | The salt used in the hash function.                      |
| `numBallotsToCount`  | `number`  | `undefined`   | The number of ballots to count for the calculation.      |
| `useQuadraticVoting` | `boolean` | `true`        | Whether to use quadratic voting or not. Default is true. |

#### Returns

`bigint`

Returns the hash of the total spent voice credits and a salt, computed as Poseidon([totalCredits, _salt]).

#### Defined in

[Poll.ts:1400](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1400)

---

### getNumSignups

▸ **getNumSignups**(): `bigint`

Get the number of signups

#### Returns

`bigint`

The number of signups

#### Defined in

[Poll.ts:1665](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1665)

---

### hasUnfinishedSubsidyCalculation

▸ **hasUnfinishedSubsidyCalculation**(): `boolean`

This method checks if there are any unfinished subsidy calculations.

#### Returns

`boolean`

Returns true if the product of the row batch index (rbi) and batch size or
the product of column batch index (cbi) and batch size is less than the length
of the ballots array, indicating that there are still ballots left to be processed.
Otherwise, it returns false.

#### Implementation of

IPoll.hasUnfinishedSubsidyCalculation

#### Defined in

[Poll.ts:906](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L906)

---

### hasUnprocessedMessages

▸ **hasUnprocessedMessages**(): `boolean`

This method checks if there are any unprocessed messages in the Poll instance.

#### Returns

`boolean`

Returns true if the number of processed batches is
less than the total number of batches, false otherwise.

#### Implementation of

IPoll.hasUnprocessedMessages

#### Defined in

[Poll.ts:411](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L411)

---

### hasUntalliedBallots

▸ **hasUntalliedBallots**(): `boolean`

Checks whether there are any untallied ballots.

#### Returns

`boolean`

Whether there are any untallied ballots

#### Implementation of

IPoll.hasUntalliedBallots

#### Defined in

[Poll.ts:897](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L897)

---

### increaseSubsidyIndex

▸ **increaseSubsidyIndex**(): `void`

It increases the index for the subsidy calculation.

#### Returns

`void`

#### Defined in

[Poll.ts:980](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L980)

---

### previousSubsidyIndexToString

▸ **previousSubsidyIndexToString**(): `string`

This method converts the previous subsidy index to a string.

#### Returns

`string`

Returns a string representation of the previous subsidy index.
The string is in the format "rbi-cbi", where rbi and cbi are
the previous row batch index and column batch index respectively.

#### Defined in

[Poll.ts:997](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L997)

---

### processAllMessages

▸ **processAllMessages**(): `Object`

Process all messages. This function does not update the ballots or state
leaves; rather, it copies and then updates them. This makes it possible
to test the result of multiple processMessage() invocations.

#### Returns

`Object`

The state leaves and ballots of the poll

| Name          | Type          |
| :------------ | :------------ |
| `ballots`     | `Ballot`[]    |
| `stateLeaves` | `StateLeaf`[] |

#### Implementation of

IPoll.processAllMessages

#### Defined in

[Poll.ts:881](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L881)

---

### processMessage

▸ **processMessage**(`message`, `encPubKey`, `qv?`): `IProcessMessagesOutput`

Process one message.

#### Parameters

| Name        | Type      | Default value | Description                                                |
| :---------- | :-------- | :------------ | :--------------------------------------------------------- |
| `message`   | `Message` | `undefined`   | The message to process.                                    |
| `encPubKey` | `PubKey`  | `undefined`   | The public key associated with the encryption private key. |
| `qv`        | `boolean` | `true`        | -                                                          |

#### Returns

`IProcessMessagesOutput`

A number of variables which will be used in the zk-SNARK circuit.

#### Defined in

[Poll.ts:225](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L225)

---

### processMessages

▸ **processMessages**(`pollId`, `qv?`, `quiet?`): [`IProcessMessagesCircuitInputs`](../interfaces/IProcessMessagesCircuitInputs.md)

Process \_batchSize messages starting from the saved index. This
function will process messages even if the number of messages is not an
exact multiple of \_batchSize. e.g. if there are 10 messages, index is
8, and \_batchSize is 4, this function will only process the last two
messages in this.messages, and finally update the zeroth state leaf.
Note that this function will only process as many state leaves as there
are ballots to prevent accidental inclusion of a new user after this
poll has concluded.

#### Parameters

| Name     | Type      | Default value | Description                                                |
| :------- | :-------- | :------------ | :--------------------------------------------------------- |
| `pollId` | `bigint`  | `undefined`   | The ID of the poll associated with the messages to process |
| `qv`     | `boolean` | `true`        | -                                                          |
| `quiet`  | `boolean` | `true`        | Whether to log errors or not                               |

#### Returns

[`IProcessMessagesCircuitInputs`](../interfaces/IProcessMessagesCircuitInputs.md)

stringified circuit inputs

#### Implementation of

IPoll.processMessages

#### Defined in

[Poll.ts:437](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L437)

---

### publishMessage

▸ **publishMessage**(`message`, `encPubKey`): `void`

Inserts a Message and the corresponding public key used to generate the
ECDH shared key which was used to encrypt said message.

#### Parameters

| Name        | Type      | Description                                |
| :---------- | :-------- | :----------------------------------------- |
| `message`   | `Message` | The message to insert                      |
| `encPubKey` | `PubKey`  | The public key used to encrypt the message |

#### Returns

`void`

#### Implementation of

IPoll.publishMessage

#### Defined in

[Poll.ts:372](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L372)

---

### setCoordinatorKeypair

▸ **setCoordinatorKeypair**(`serializedPrivateKey`): `void`

Set the coordinator's keypair

#### Parameters

| Name                   | Type     | Description                |
| :--------------------- | :------- | :------------------------- |
| `serializedPrivateKey` | `string` | the serialized private key |

#### Returns

`void`

#### Implementation of

IPoll.setCoordinatorKeypair

#### Defined in

[Poll.ts:1649](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1649)

---

### setNumSignups

▸ **setNumSignups**(`numSignups`): `void`

Set the number of signups to match the ones from the contract

#### Parameters

| Name         | Type     | Description           |
| :----------- | :------- | :-------------------- |
| `numSignups` | `bigint` | the number of signups |

#### Returns

`void`

#### Defined in

[Poll.ts:1657](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1657)

---

### subsidyCalculation

▸ **subsidyCalculation**(`rowStartIndex`, `colStartIndex`): `Ballot`[][]

This method calculates the subsidy for a batch of ballots.

#### Parameters

| Name            | Type     | Description                                |
| :-------------- | :------- | :----------------------------------------- |
| `rowStartIndex` | `number` | The starting index for the row ballots.    |
| `colStartIndex` | `number` | The starting index for the column ballots. |

#### Returns

`Ballot`[][]

Returns a 2D array of ballots. The first array contains the row ballots and the second array contains the column ballots.

#### Defined in

[Poll.ts:1040](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1040)

---

### subsidyPerBatch

▸ **subsidyPerBatch**(): [`ISubsidyCircuitInputs`](../interfaces/ISubsidyCircuitInputs.md)

This method calculates the subsidy per batch.

#### Returns

[`ISubsidyCircuitInputs`](../interfaces/ISubsidyCircuitInputs.md)

Returns an array of big integers which represent the circuit inputs for the subsidy calculation.

#### Implementation of

IPoll.subsidyPerBatch

#### Defined in

[Poll.ts:915](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L915)

---

### tallyVotes

▸ **tallyVotes**(): [`ITallyCircuitInputs`](../interfaces/ITallyCircuitInputs.md)

This method tallies a ballots and updates the tally results.

#### Returns

[`ITallyCircuitInputs`](../interfaces/ITallyCircuitInputs.md)

the circuit inputs for the TallyVotes circuit.

#### Implementation of

IPoll.tallyVotes

#### Defined in

[Poll.ts:1079](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1079)

---

### tallyVotesNonQv

▸ **tallyVotesNonQv**(): [`ITallyCircuitInputs`](../interfaces/ITallyCircuitInputs.md)

#### Returns

[`ITallyCircuitInputs`](../interfaces/ITallyCircuitInputs.md)

#### Defined in

[Poll.ts:1254](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1254)

---

### toJSON

▸ **toJSON**(): `IJsonPoll`

Serialize the Poll object to a JSON object

#### Returns

`IJsonPoll`

a JSON object

#### Implementation of

IPoll.toJSON

#### Defined in

[Poll.ts:1576](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1576)

---

### topupMessage

▸ **topupMessage**(`message`): `void`

Top up the voice credit balance of a user.

#### Parameters

| Name      | Type      | Description                                    |
| :-------- | :-------- | :--------------------------------------------- |
| `message` | `Message` | The message to top up the voice credit balance |

#### Returns

`void`

#### Implementation of

IPoll.topupMessage

#### Defined in

[Poll.ts:342](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L342)

---

### updatePoll

▸ **updatePoll**(`numSignups`): `void`

Update a Poll with data from MaciState.
This is the step where we copy the state from the MaciState instance,
and set the number of signups we have so far.

#### Parameters

| Name         | Type     |
| :----------- | :------- |
| `numSignups` | `bigint` |

#### Returns

`void`

#### Defined in

[Poll.ts:184](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L184)

---

### fromJSON

▸ **fromJSON**(`json`, `maciState`): [`Poll`](Poll.md)

Deserialize a json object into a Poll instance

#### Parameters

| Name        | Type                        | Description                          |
| :---------- | :-------------------------- | :----------------------------------- |
| `json`      | `IJsonPoll`                 | the json object to deserialize       |
| `maciState` | [`MaciState`](MaciState.md) | the reference to the MaciState Class |

#### Returns

[`Poll`](Poll.md)

a new Poll instance

#### Defined in

[Poll.ts:1600](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/core/ts/Poll.ts#L1600)
