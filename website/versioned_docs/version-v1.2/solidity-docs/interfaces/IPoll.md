# IPoll

Poll interface

### numSignUpsAndMessages

```solidity
function numSignUpsAndMessages() external view returns (uint256 numSignups, uint256 numMsgs)
```

The number of messages which have been processed and the number of signups

#### Return Values

| Name       | Type    | Description                           |
| ---------- | ------- | ------------------------------------- |
| numSignups | uint256 | The number of signups                 |
| numMsgs    | uint256 | The number of messages sent by voters |

### topup

```solidity
function topup(uint256 stateIndex, uint256 amount) external
```

Allows to publish a Topup message

#### Parameters

| Name       | Type    | Description                          |
| ---------- | ------- | ------------------------------------ |
| stateIndex | uint256 | The index of user in the state queue |
| amount     | uint256 | The amount of credits to topup       |

### publishMessage

```solidity
function publishMessage(struct DomainObjs.Message _message, struct DomainObjs.PubKey _encPubKey) external
```

Allows anyone to publish a message (an encrypted command and signature).
This function also enqueues the message.

#### Parameters

| Name        | Type                      | Description                                                                                                                                        |
| ----------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_message   | struct DomainObjs.Message | The message to publish                                                                                                                             |
| \_encPubKey | struct DomainObjs.PubKey  | An ephemeral public key which can be combined with the coordinator's private key to generate an ECDH shared key with which to encrypt the message. |

### mergeMaciStateAqSubRoots

```solidity
function mergeMaciStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) external
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
function mergeMaciStateAq(uint256 _pollId) external
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
function mergeMessageAqSubRoots(uint256 _numSrQueueOps) external
```

The first step in merging the message AccQueue so that the
ProcessMessages circuit can access the message root.

#### Parameters

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| \_numSrQueueOps | uint256 | The number of subroot queue operations to perform |

### mergeMessageAq

```solidity
function mergeMessageAq() external
```

The second step in merging the message AccQueue so that the
ProcessMessages circuit can access the message root.

### getDeployTimeAndDuration

```solidity
function getDeployTimeAndDuration() external view returns (uint256 _deployTime, uint256 _duration)
```

Returns the Poll's deploy time and duration

#### Return Values

| Name         | Type    | Description              |
| ------------ | ------- | ------------------------ |
| \_deployTime | uint256 | The deployment timestamp |
| \_duration   | uint256 | The duration of the poll |

### stateAqMerged

```solidity
function stateAqMerged() external view returns (bool)
```

Get the result of whether the MACI contract's stateAq has been merged by this contract

#### Return Values

| Name | Type | Description                                                          |
| ---- | ---- | -------------------------------------------------------------------- |
| [0]  | bool | Whether the MACI contract's stateAq has been merged by this contract |

### treeDepths

```solidity
function treeDepths() external view returns (uint8 intStateTreeDepth, uint8 messageTreeSubDepth, uint8 messageTreeDepth, uint8 voteOptionTreeDepth)
```

Get the depths of the merkle trees

#### Return Values

| Name                | Type  | Description                          |
| ------------------- | ----- | ------------------------------------ |
| intStateTreeDepth   | uint8 | The depth of the state tree          |
| messageTreeSubDepth | uint8 | The subdepth of the message tree     |
| messageTreeDepth    | uint8 | The depth of the message tree        |
| voteOptionTreeDepth | uint8 | The subdepth of the vote option tree |

### maxValues

```solidity
function maxValues() external view returns (uint256 maxMessages, uint256 maxVoteOptions)
```

Get the max values for the poll

#### Return Values

| Name           | Type    | Description                        |
| -------------- | ------- | ---------------------------------- |
| maxMessages    | uint256 | The maximum number of messages     |
| maxVoteOptions | uint256 | The maximum number of vote options |

### extContracts

```solidity
function extContracts() external view returns (contract IMACI maci, contract AccQueue messageAq, contract TopupCredit topupCredit)
```

Get the external contracts

#### Return Values

| Name        | Type                 | Description              |
| ----------- | -------------------- | ------------------------ |
| maci        | contract IMACI       | The IMACI contract       |
| messageAq   | contract AccQueue    | The AccQueue contract    |
| topupCredit | contract TopupCredit | The TopupCredit contract |

### coordinatorPubKeyHash

```solidity
function coordinatorPubKeyHash() external view returns (uint256 _coordinatorPubKeyHash)
```

Get the hash of coordinator's public key

#### Return Values

| Name                    | Type    | Description                          |
| ----------------------- | ------- | ------------------------------------ |
| \_coordinatorPubKeyHash | uint256 | the hash of coordinator's public key |

### currentSbCommitment

```solidity
function currentSbCommitment() external view returns (uint256)
```

Get the commitment to the state leaves and the ballots. This is
hash3(stateRoot, ballotRoot, salt).
Its initial value should be
hash(maciStateRootSnapshot, emptyBallotRoot, 0)
Each successful invocation of processMessages() should use a different
salt to update this value, so that an external observer cannot tell in
the case that none of the messages are valid.

#### Return Values

| Name | Type    | Description                                        |
| ---- | ------- | -------------------------------------------------- |
| [0]  | uint256 | The commitment to the state leaves and the ballots |
