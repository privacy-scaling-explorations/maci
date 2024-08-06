# Poll

A Poll contract allows voters to submit encrypted messages
which can be either votes, key change messages or topup messages.

_Do not deploy this directly. Use PollFactory.deploy() which performs some
checks on the Poll constructor arguments._

### isInit

```solidity
bool isInit
```

Whether the Poll has been initialized

### coordinatorPubKey

```solidity
struct DomainObjs.PubKey coordinatorPubKey
```

The coordinator's public key

### coordinatorPubKeyHash

```solidity
uint256 coordinatorPubKeyHash
```

Hash of the coordinator's public key

### mergedStateRoot

```solidity
uint256 mergedStateRoot
```

the state root of the state merkle tree

### deployTime

```solidity
uint256 deployTime
```

### duration

```solidity
uint256 duration
```

### stateAqMerged

```solidity
bool stateAqMerged
```

Whether the MACI contract's stateAq has been merged by this contract

### currentSbCommitment

```solidity
uint256 currentSbCommitment
```

Get the commitment to the state leaves and the ballots. This is
hash3(stateRoot, ballotRoot, salt).
Its initial value should be
hash(maciStateRootSnapshot, emptyBallotRoot, 0)
Each successful invocation of processMessages() should use a different
salt to update this value, so that an external observer cannot tell in
the case that none of the messages are valid.

### numMessages

```solidity
uint256 numMessages
```

The number of messages that have been published

### numSignups

```solidity
uint256 numSignups
```

The number of signups that have been processed
before the Poll ended (stateAq merged)

### maxValues

```solidity
struct Params.MaxValues maxValues
```

Max values for the poll

### treeDepths

```solidity
struct Params.TreeDepths treeDepths
```

Depths of the merkle trees

### extContracts

```solidity
struct Params.ExtContracts extContracts
```

The contracts used by the Poll

### VotingPeriodOver

```solidity
error VotingPeriodOver()
```

### VotingPeriodNotOver

```solidity
error VotingPeriodNotOver()
```

### PollAlreadyInit

```solidity
error PollAlreadyInit()
```

### TooManyMessages

```solidity
error TooManyMessages()
```

### MaciPubKeyLargerThanSnarkFieldSize

```solidity
error MaciPubKeyLargerThanSnarkFieldSize()
```

### StateAqAlreadyMerged

```solidity
error StateAqAlreadyMerged()
```

### StateAqSubtreesNeedMerge

```solidity
error StateAqSubtreesNeedMerge()
```

### InvalidBatchLength

```solidity
error InvalidBatchLength()
```

### PublishMessage

```solidity
event PublishMessage(struct DomainObjs.Message _message, struct DomainObjs.PubKey _encPubKey)
```

### TopupMessage

```solidity
event TopupMessage(struct DomainObjs.Message _message)
```

### MergeMaciStateAqSubRoots

```solidity
event MergeMaciStateAqSubRoots(uint256 _numSrQueueOps)
```

### MergeMaciStateAq

```solidity
event MergeMaciStateAq(uint256 _stateRoot, uint256 _numSignups)
```

### MergeMessageAqSubRoots

```solidity
event MergeMessageAqSubRoots(uint256 _numSrQueueOps)
```

### MergeMessageAq

```solidity
event MergeMessageAq(uint256 _messageRoot)
```

### constructor

```solidity
constructor(uint256 _duration, struct Params.MaxValues _maxValues, struct Params.TreeDepths _treeDepths, struct DomainObjs.PubKey _coordinatorPubKey, struct Params.ExtContracts _extContracts) public payable
```

Each MACI instance can have multiple Polls.
When a Poll is deployed, its voting period starts immediately.

#### Parameters

| Name                | Type                       | Description                                     |
| ------------------- | -------------------------- | ----------------------------------------------- |
| \_duration          | uint256                    | The duration of the voting period, in seconds   |
| \_maxValues         | struct Params.MaxValues    | The maximum number of messages and vote options |
| \_treeDepths        | struct Params.TreeDepths   | The depths of the merkle trees                  |
| \_coordinatorPubKey | struct DomainObjs.PubKey   | The coordinator's public key                    |
| \_extContracts      | struct Params.ExtContracts | The external contracts                          |

### isAfterVotingDeadline

```solidity
modifier isAfterVotingDeadline()
```

A modifier that causes the function to revert if the voting period is
not over.

### isWithinVotingDeadline

```solidity
modifier isWithinVotingDeadline()
```

A modifier that causes the function to revert if the voting period is
over

### init

```solidity
function init() public
```

The initialization function.

_Should be called immediately after Poll creation
and messageAq ownership transferred_

### topup

```solidity
function topup(uint256 stateIndex, uint256 amount) public virtual
```

Allows to publish a Topup message

#### Parameters

| Name       | Type    | Description                          |
| ---------- | ------- | ------------------------------------ |
| stateIndex | uint256 | The index of user in the state queue |
| amount     | uint256 | The amount of credits to topup       |

### publishMessage

```solidity
function publishMessage(struct DomainObjs.Message _message, struct DomainObjs.PubKey _encPubKey) public virtual
```

Allows anyone to publish a message (an encrypted command and signature).
This function also enqueues the message.

#### Parameters

| Name        | Type                      | Description                                                                                                                                        |
| ----------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_message   | struct DomainObjs.Message | The message to publish                                                                                                                             |
| \_encPubKey | struct DomainObjs.PubKey  | An ephemeral public key which can be combined with the coordinator's private key to generate an ECDH shared key with which to encrypt the message. |

### publishMessageBatch

```solidity
function publishMessageBatch(struct DomainObjs.Message[] _messages, struct DomainObjs.PubKey[] _encPubKeys) external
```

submit a message batch

_Can only be submitted before the voting deadline_

#### Parameters

| Name         | Type                        | Description               |
| ------------ | --------------------------- | ------------------------- |
| \_messages   | struct DomainObjs.Message[] | the messages              |
| \_encPubKeys | struct DomainObjs.PubKey[]  | the encrypted public keys |

### mergeMaciStateAqSubRoots

```solidity
function mergeMaciStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) public
```

The first step of merging the MACI state AccQueue. This allows the
ProcessMessages circuit to access the latest state tree and ballots via
currentSbCommitment.

#### Parameters

| Name            | Type    | Description               |
| --------------- | ------- | ------------------------- |
| \_numSrQueueOps | uint256 | Number of operations      |
| \_pollId        | uint256 | The ID of the active Poll |

### mergeMaciStateAq

```solidity
function mergeMaciStateAq(uint256 _pollId) public
```

The second step of merging the MACI state AccQueue. This allows the
ProcessMessages circuit to access the latest state tree and ballots via
currentSbCommitment.

#### Parameters

| Name     | Type    | Description               |
| -------- | ------- | ------------------------- |
| \_pollId | uint256 | The ID of the active Poll |

### mergeMessageAqSubRoots

```solidity
function mergeMessageAqSubRoots(uint256 _numSrQueueOps) public
```

The first step in merging the message AccQueue so that the
ProcessMessages circuit can access the message root.

#### Parameters

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| \_numSrQueueOps | uint256 | The number of subroot queue operations to perform |

### mergeMessageAq

```solidity
function mergeMessageAq() public
```

The second step in merging the message AccQueue so that the
ProcessMessages circuit can access the message root.

### getDeployTimeAndDuration

```solidity
function getDeployTimeAndDuration() public view returns (uint256 pollDeployTime, uint256 pollDuration)
```

Returns the Poll's deploy time and duration

#### Return Values

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| pollDeployTime | uint256 |             |
| pollDuration   | uint256 |             |

### numSignUpsAndMessages

```solidity
function numSignUpsAndMessages() public view returns (uint256 numSUps, uint256 numMsgs)
```

The number of messages which have been processed and the number of signups

#### Return Values

| Name    | Type    | Description                           |
| ------- | ------- | ------------------------------------- |
| numSUps | uint256 |                                       |
| numMsgs | uint256 | The number of messages sent by voters |
