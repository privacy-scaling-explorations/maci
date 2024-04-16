# AccQueueBinaryMaci

This contract extends AccQueueBinary and MerkleBinaryMaci

_This contract is used for creating a
Merkle tree with binary (2 leaves per node) structure_

### constructor

```solidity
constructor(uint256 _subDepth) public
```

Constructor for creating AccQueueBinaryMaci contract

#### Parameters

| Name       | Type    | Description               |
| ---------- | ------- | ------------------------- |
| \_subDepth | uint256 | The depth of each subtree |

### getZero

```solidity
function getZero(uint256 _level) internal view returns (uint256 zero)
```

Returns the zero leaf at a specified level

#### Parameters

| Name    | Type    | Description                                |
| ------- | ------- | ------------------------------------------ |
| \_level | uint256 | The level at which to return the zero leaf |
