# AccQueueBinary

This contract defines a Merkle tree where each leaf insertion only updates a
subtree. To obtain the main tree root, the contract owner must merge the
subtrees together. Merging subtrees requires at least 2 operations:
mergeSubRoots(), and merge(). To get around the gas limit,
the mergeSubRoots() can be performed in multiple transactions.

_This contract is for a binary tree (2 leaves per node)_

### constructor

```solidity
constructor(uint256 _subDepth) internal
```

Create a new AccQueueBinary

### hashLevel

```solidity
function hashLevel(uint256 _level, uint256 _leaf) internal returns (uint256 hashed)
```

Hash the contents of the specified level and the specified leaf.

#### Parameters

| Name    | Type    | Description                      |
| ------- | ------- | -------------------------------- |
| \_level | uint256 | The level to hash.               |
| \_leaf  | uint256 | The leaf include with the level. |

#### Return Values

| Name   | Type    | Description                     |
| ------ | ------- | ------------------------------- |
| hashed | uint256 | The hash of the level and leaf. |

### hashLevelLeaf

```solidity
function hashLevelLeaf(uint256 _level, uint256 _leaf) public view returns (uint256 hashed)
```

Hash the contents of the specified level and the specified leaf.

### \_fill

```solidity
function _fill(uint256 _level) internal
```

An internal function which fills a subtree.

#### Parameters

| Name    | Type    | Description                             |
| ------- | ------- | --------------------------------------- |
| \_level | uint256 | The level at which to fill the subtree. |
