# IVkRegistry

VkRegistry interface

### getTallyVk

```solidity
function getTallyVk(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth) external view returns (struct SnarkCommon.VerifyingKey)
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
| [0]  | struct SnarkCommon.VerifyingKey | The verifying key |

### getProcessVk

```solidity
function getProcessVk(uint256 _stateTreeDepth, uint256 _messageTreeDepth, uint256 _voteOptionTreeDepth, uint256 _messageBatchSize) external view returns (struct SnarkCommon.VerifyingKey)
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
| [0]  | struct SnarkCommon.VerifyingKey | The verifying key |

### getSubsidyVk

```solidity
function getSubsidyVk(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth) external view returns (struct SnarkCommon.VerifyingKey)
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
| [0]  | struct SnarkCommon.VerifyingKey | The verifying key |
