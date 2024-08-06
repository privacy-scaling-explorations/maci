# AccQueueQuinary0

This contract extends AccQueueQuinary and MerkleQuinary0

_This contract is used for creating a
Merkle tree with quinary (5 leaves per node) structure_

### constructor

```solidity
constructor(uint256 _subDepth) public
```

Constructor for creating AccQueueQuinary0 contract

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

#### Return Values

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| zero | uint256 | The zero leaf at the specified level |
