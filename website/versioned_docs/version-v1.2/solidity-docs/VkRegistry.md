# VkRegistry

Stores verifying keys for the circuits.
Each circuit has a signature which is its compile-time constants represented
as a uint256.

### processVks

```solidity
mapping(uint256 => struct SnarkCommon.VerifyingKey) processVks
```

### processVkSet

```solidity
mapping(uint256 => bool) processVkSet
```

### tallyVks

```solidity
mapping(uint256 => struct SnarkCommon.VerifyingKey) tallyVks
```

### tallyVkSet

```solidity
mapping(uint256 => bool) tallyVkSet
```

### subsidyVks

```solidity
mapping(uint256 => struct SnarkCommon.VerifyingKey) subsidyVks
```

### subsidyVkSet

```solidity
mapping(uint256 => bool) subsidyVkSet
```

### ProcessVkSet

```solidity
event ProcessVkSet(uint256 _sig)
```

### TallyVkSet

```solidity
event TallyVkSet(uint256 _sig)
```

### SubsidyVkSet

```solidity
event SubsidyVkSet(uint256 _sig)
```

### ProcessVkAlreadySet

```solidity
error ProcessVkAlreadySet()
```

### TallyVkAlreadySet

```solidity
error TallyVkAlreadySet()
```

### SubsidyVkAlreadySet

```solidity
error SubsidyVkAlreadySet()
```

### ProcessVkNotSet

```solidity
error ProcessVkNotSet()
```

### TallyVkNotSet

```solidity
error TallyVkNotSet()
```

### SubsidyVkNotSet

```solidity
error SubsidyVkNotSet()
```

### constructor

```solidity
constructor() public payable
```

Create a new instance of the VkRegistry contract

### isProcessVkSet

```solidity
function isProcessVkSet(uint256 _sig) public view returns (bool isSet)
```

Check if the process verifying key is set

#### Parameters

| Name  | Type    | Description   |
| ----- | ------- | ------------- |
| \_sig | uint256 | The signature |

#### Return Values

| Name  | Type | Description                      |
| ----- | ---- | -------------------------------- |
| isSet | bool | whether the verifying key is set |

### isTallyVkSet

```solidity
function isTallyVkSet(uint256 _sig) public view returns (bool isSet)
```

Check if the tally verifying key is set

#### Parameters

| Name  | Type    | Description   |
| ----- | ------- | ------------- |
| \_sig | uint256 | The signature |

#### Return Values

| Name  | Type | Description                      |
| ----- | ---- | -------------------------------- |
| isSet | bool | whether the verifying key is set |

### isSubsidyVkSet

```solidity
function isSubsidyVkSet(uint256 _sig) public view returns (bool isSet)
```

Check if the subsidy verifying key is set

#### Parameters

| Name  | Type    | Description   |
| ----- | ------- | ------------- |
| \_sig | uint256 | The signature |

#### Return Values

| Name  | Type | Description                      |
| ----- | ---- | -------------------------------- |
| isSet | bool | whether the verifying key is set |

### genProcessVkSig

```solidity
function genProcessVkSig(uint256 _stateTreeDepth, uint256 _messageTreeDepth, uint256 _voteOptionTreeDepth, uint256 _messageBatchSize) public pure returns (uint256 sig)
```

generate the signature for the process verifying key

#### Parameters

| Name                  | Type    | Description                |
| --------------------- | ------- | -------------------------- |
| \_stateTreeDepth      | uint256 | The state tree depth       |
| \_messageTreeDepth    | uint256 | The message tree depth     |
| \_voteOptionTreeDepth | uint256 | The vote option tree depth |
| \_messageBatchSize    | uint256 | The message batch size     |

### genTallyVkSig

```solidity
function genTallyVkSig(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth) public pure returns (uint256 sig)
```

generate the signature for the tally verifying key

#### Parameters

| Name                  | Type    | Description                       |
| --------------------- | ------- | --------------------------------- |
| \_stateTreeDepth      | uint256 | The state tree depth              |
| \_intStateTreeDepth   | uint256 | The intermediate state tree depth |
| \_voteOptionTreeDepth | uint256 | The vote option tree depth        |

#### Return Values

| Name | Type    | Description   |
| ---- | ------- | ------------- |
| sig  | uint256 | The signature |

### genSubsidyVkSig

```solidity
function genSubsidyVkSig(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth) public pure returns (uint256 sig)
```

generate the signature for the subsidy verifying key

#### Parameters

| Name                  | Type    | Description                       |
| --------------------- | ------- | --------------------------------- |
| \_stateTreeDepth      | uint256 | The state tree depth              |
| \_intStateTreeDepth   | uint256 | The intermediate state tree depth |
| \_voteOptionTreeDepth | uint256 | The vote option tree depth        |

#### Return Values

| Name | Type    | Description   |
| ---- | ------- | ------------- |
| sig  | uint256 | The signature |

### setVerifyingKeys

```solidity
function setVerifyingKeys(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _messageTreeDepth, uint256 _voteOptionTreeDepth, uint256 _messageBatchSize, struct SnarkCommon.VerifyingKey _processVk, struct SnarkCommon.VerifyingKey _tallyVk) public
```

Set the process and tally verifying keys for a certain combination
of parameters

#### Parameters

| Name                  | Type                            | Description                       |
| --------------------- | ------------------------------- | --------------------------------- |
| \_stateTreeDepth      | uint256                         | The state tree depth              |
| \_intStateTreeDepth   | uint256                         | The intermediate state tree depth |
| \_messageTreeDepth    | uint256                         | The message tree depth            |
| \_voteOptionTreeDepth | uint256                         | The vote option tree depth        |
| \_messageBatchSize    | uint256                         | The message batch size            |
| \_processVk           | struct SnarkCommon.VerifyingKey | The process verifying key         |
| \_tallyVk             | struct SnarkCommon.VerifyingKey | The tally verifying key           |

### setSubsidyKeys

```solidity
function setSubsidyKeys(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth, struct SnarkCommon.VerifyingKey _subsidyVk) public
```

Set the process verifying key for a certain combination
of parameters

#### Parameters

| Name                  | Type                            | Description                       |
| --------------------- | ------------------------------- | --------------------------------- |
| \_stateTreeDepth      | uint256                         | The state tree depth              |
| \_intStateTreeDepth   | uint256                         | The intermediate state tree depth |
| \_voteOptionTreeDepth | uint256                         | The vote option tree depth        |
| \_subsidyVk           | struct SnarkCommon.VerifyingKey | The verifying key                 |

### hasProcessVk

```solidity
function hasProcessVk(uint256 _stateTreeDepth, uint256 _messageTreeDepth, uint256 _voteOptionTreeDepth, uint256 _messageBatchSize) public view returns (bool isSet)
```

Check if the process verifying key is set

#### Parameters

| Name                  | Type    | Description                |
| --------------------- | ------- | -------------------------- |
| \_stateTreeDepth      | uint256 | The state tree depth       |
| \_messageTreeDepth    | uint256 | The message tree depth     |
| \_voteOptionTreeDepth | uint256 | The vote option tree depth |
| \_messageBatchSize    | uint256 | The message batch size     |

#### Return Values

| Name  | Type | Description                      |
| ----- | ---- | -------------------------------- |
| isSet | bool | whether the verifying key is set |

### getProcessVkBySig

```solidity
function getProcessVkBySig(uint256 _sig) public view returns (struct SnarkCommon.VerifyingKey vk)
```

Get the process verifying key by signature

#### Parameters

| Name  | Type    | Description   |
| ----- | ------- | ------------- |
| \_sig | uint256 | The signature |

#### Return Values

| Name | Type                            | Description       |
| ---- | ------------------------------- | ----------------- |
| vk   | struct SnarkCommon.VerifyingKey | The verifying key |

### getProcessVk

```solidity
function getProcessVk(uint256 _stateTreeDepth, uint256 _messageTreeDepth, uint256 _voteOptionTreeDepth, uint256 _messageBatchSize) public view returns (struct SnarkCommon.VerifyingKey vk)
```

Get the process verifying key

#### Parameters

| Name                  | Type    | Description                |
| --------------------- | ------- | -------------------------- |
| \_stateTreeDepth      | uint256 | The state tree depth       |
| \_messageTreeDepth    | uint256 | The message tree depth     |
| \_voteOptionTreeDepth | uint256 | The vote option tree depth |
| \_messageBatchSize    | uint256 | The message batch size     |

#### Return Values

| Name | Type                            | Description       |
| ---- | ------------------------------- | ----------------- |
| vk   | struct SnarkCommon.VerifyingKey | The verifying key |

### hasTallyVk

```solidity
function hasTallyVk(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth) public view returns (bool isSet)
```

Check if the tally verifying key is set

#### Parameters

| Name                  | Type    | Description                       |
| --------------------- | ------- | --------------------------------- |
| \_stateTreeDepth      | uint256 | The state tree depth              |
| \_intStateTreeDepth   | uint256 | The intermediate state tree depth |
| \_voteOptionTreeDepth | uint256 | The vote option tree depth        |

#### Return Values

| Name  | Type | Description                      |
| ----- | ---- | -------------------------------- |
| isSet | bool | whether the verifying key is set |

### getTallyVkBySig

```solidity
function getTallyVkBySig(uint256 _sig) public view returns (struct SnarkCommon.VerifyingKey vk)
```

Get the tally verifying key by signature

#### Parameters

| Name  | Type    | Description   |
| ----- | ------- | ------------- |
| \_sig | uint256 | The signature |

#### Return Values

| Name | Type                            | Description       |
| ---- | ------------------------------- | ----------------- |
| vk   | struct SnarkCommon.VerifyingKey | The verifying key |

### getTallyVk

```solidity
function getTallyVk(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth) public view returns (struct SnarkCommon.VerifyingKey vk)
```

Get the tally verifying key

#### Parameters

| Name                  | Type    | Description                       |
| --------------------- | ------- | --------------------------------- |
| \_stateTreeDepth      | uint256 | The state tree depth              |
| \_intStateTreeDepth   | uint256 | The intermediate state tree depth |
| \_voteOptionTreeDepth | uint256 | The vote option tree depth        |

#### Return Values

| Name | Type                            | Description       |
| ---- | ------------------------------- | ----------------- |
| vk   | struct SnarkCommon.VerifyingKey | The verifying key |

### hasSubsidyVk

```solidity
function hasSubsidyVk(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth) public view returns (bool isSet)
```

Check if the subsidy verifying key is set

#### Parameters

| Name                  | Type    | Description                       |
| --------------------- | ------- | --------------------------------- |
| \_stateTreeDepth      | uint256 | The state tree depth              |
| \_intStateTreeDepth   | uint256 | The intermediate state tree depth |
| \_voteOptionTreeDepth | uint256 | The vote option tree depth        |

#### Return Values

| Name  | Type | Description                      |
| ----- | ---- | -------------------------------- |
| isSet | bool | whether the verifying key is set |

### getSubsidyVkBySig

```solidity
function getSubsidyVkBySig(uint256 _sig) public view returns (struct SnarkCommon.VerifyingKey vk)
```

Get the subsidy verifying key by signature

#### Parameters

| Name  | Type    | Description   |
| ----- | ------- | ------------- |
| \_sig | uint256 | The signature |

#### Return Values

| Name | Type                            | Description       |
| ---- | ------------------------------- | ----------------- |
| vk   | struct SnarkCommon.VerifyingKey | The verifying key |

### getSubsidyVk

```solidity
function getSubsidyVk(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth) public view returns (struct SnarkCommon.VerifyingKey vk)
```

Get the subsidy verifying key

#### Parameters

| Name                  | Type    | Description                       |
| --------------------- | ------- | --------------------------------- |
| \_stateTreeDepth      | uint256 | The state tree depth              |
| \_intStateTreeDepth   | uint256 | The intermediate state tree depth |
| \_voteOptionTreeDepth | uint256 | The vote option tree depth        |

#### Return Values

| Name | Type                            | Description       |
| ---- | ------------------------------- | ----------------- |
| vk   | struct SnarkCommon.VerifyingKey | The verifying key |
