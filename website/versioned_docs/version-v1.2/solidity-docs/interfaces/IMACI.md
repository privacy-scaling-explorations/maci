# IMACI

MACI interface

### stateTreeDepth

```solidity
function stateTreeDepth() external view returns (uint8)
```

Get the depth of the state tree

#### Return Values

| Name | Type  | Description                 |
| ---- | ----- | --------------------------- |
| [0]  | uint8 | The depth of the state tree |

### getStateAqRoot

```solidity
function getStateAqRoot() external view returns (uint256)
```

Return the main root of the StateAq contract

#### Return Values

| Name | Type    | Description     |
| ---- | ------- | --------------- |
| [0]  | uint256 | The Merkle root |

### mergeStateAqSubRoots

```solidity
function mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) external
```

Allow Poll contracts to merge the state subroots

#### Parameters

| Name            | Type    | Description               |
| --------------- | ------- | ------------------------- |
| \_numSrQueueOps | uint256 | Number of operations      |
| \_pollId        | uint256 | The ID of the active Poll |

### mergeStateAq

```solidity
function mergeStateAq(uint256 _pollId) external returns (uint256)
```

Allow Poll contracts to merge the state root

#### Parameters

| Name     | Type    | Description        |
| -------- | ------- | ------------------ |
| \_pollId | uint256 | The active Poll ID |

#### Return Values

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | uint256 | The calculated Merkle root |

### numSignUps

```solidity
function numSignUps() external view returns (uint256)
```

Get the number of signups

#### Return Values

| Name | Type    | Description                      |
| ---- | ------- | -------------------------------- |
| [0]  | uint256 | numsignUps The number of signups |

### stateAq

```solidity
function stateAq() external view returns (contract AccQueue)
```

Get the state AccQueue

#### Return Values

| Name | Type              | Description        |
| ---- | ----------------- | ------------------ |
| [0]  | contract AccQueue | The state AccQueue |
