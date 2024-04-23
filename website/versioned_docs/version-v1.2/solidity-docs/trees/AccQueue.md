# AccQueue

This contract defines a Merkle tree where each leaf insertion only updates a
subtree. To obtain the main tree root, the contract owner must merge the
subtrees together. Merging subtrees requires at least 2 operations:
mergeSubRoots(), and merge(). To get around the gas limit,
the mergeSubRoots() can be performed in multiple transactions.

### MAX_DEPTH

```solidity
uint256 MAX_DEPTH
```

### Queue

```solidity
struct Queue {
  uint256[4][33] levels;
  uint256[33] indices;
}
```

### subDepth

```solidity
uint256 subDepth
```

### hashLength

```solidity
uint256 hashLength
```

### subTreeCapacity

```solidity
uint256 subTreeCapacity
```

### isBinary

```solidity
bool isBinary
```

### currentSubtreeIndex

```solidity
uint256 currentSubtreeIndex
```

### leafQueue

```solidity
struct AccQueue.Queue leafQueue
```

### subRootQueue

```solidity
struct AccQueue.Queue subRootQueue
```

### subRoots

```solidity
mapping(uint256 => uint256) subRoots
```

### mainRoots

```solidity
uint256[33] mainRoots
```

### subTreesMerged

```solidity
bool subTreesMerged
```

### treeMerged

```solidity
bool treeMerged
```

### smallSRTroot

```solidity
uint256 smallSRTroot
```

### nextSubRootIndex

```solidity
uint256 nextSubRootIndex
```

### numLeaves

```solidity
uint256 numLeaves
```

### SubDepthCannotBeZero

```solidity
error SubDepthCannotBeZero()
```

custom errors

### SubdepthTooLarge

```solidity
error SubdepthTooLarge(uint256 _subDepth, uint256 max)
```

### InvalidHashLength

```solidity
error InvalidHashLength()
```

### DepthCannotBeZero

```solidity
error DepthCannotBeZero()
```

### SubTreesAlreadyMerged

```solidity
error SubTreesAlreadyMerged()
```

### NothingToMerge

```solidity
error NothingToMerge()
```

### SubTreesNotMerged

```solidity
error SubTreesNotMerged()
```

### DepthTooLarge

```solidity
error DepthTooLarge(uint256 _depth, uint256 max)
```

### DepthTooSmall

```solidity
error DepthTooSmall(uint256 _depth, uint256 min)
```

### InvalidIndex

```solidity
error InvalidIndex(uint256 _index)
```

### InvalidLevel

```solidity
error InvalidLevel()
```

### constructor

```solidity
constructor(uint256 _subDepth, uint256 _hashLength) internal payable
```

Create a new AccQueue

#### Parameters

| Name         | Type    | Description                             |
| ------------ | ------- | --------------------------------------- |
| \_subDepth   | uint256 | The depth of each subtree.              |
| \_hashLength | uint256 | The number of leaves per node (2 or 5). |

### hashLevel

```solidity
function hashLevel(uint256 _level, uint256 _leaf) internal virtual returns (uint256 _hash)
```

Hash the contents of the specified level and the specified leaf.
This is a virtual function as the hash function which the overriding
contract uses will be either hashLeftRight or hash5, which require
different input array lengths.

#### Parameters

| Name    | Type    | Description                      |
| ------- | ------- | -------------------------------- |
| \_level | uint256 | The level to hash.               |
| \_leaf  | uint256 | The leaf include with the level. |

#### Return Values

| Name   | Type    | Description                     |
| ------ | ------- | ------------------------------- |
| \_hash | uint256 | The hash of the level and leaf. |

### hashLevelLeaf

```solidity
function hashLevelLeaf(uint256 _level, uint256 _leaf) public view virtual returns (uint256 _hash)
```

Hash the contents of the specified level and the specified leaf.
This is a virtual function as the hash function which the overriding
contract uses will be either hashLeftRight or hash5, which require
different input array lengths.

#### Parameters

| Name    | Type    | Description                      |
| ------- | ------- | -------------------------------- |
| \_level | uint256 | The level to hash.               |
| \_leaf  | uint256 | The leaf include with the level. |

#### Return Values

| Name   | Type    | Description                     |
| ------ | ------- | ------------------------------- |
| \_hash | uint256 | The hash of the level and leaf. |

### getZero

```solidity
function getZero(uint256 _level) internal virtual returns (uint256 zero)
```

Returns the zero leaf at a specified level.
This is a virtual function as the hash function which the overriding
contract uses will be either hashLeftRight or hash5, which will produce
different zero values (e.g. hashLeftRight(0, 0) vs
hash5([0, 0, 0, 0, 0]). Moreover, the zero value may be a
nothing-up-my-sleeve value.

#### Parameters

| Name    | Type    | Description                                 |
| ------- | ------- | ------------------------------------------- |
| \_level | uint256 | The level at which to return the zero leaf. |

#### Return Values

| Name | Type    | Description                           |
| ---- | ------- | ------------------------------------- |
| zero | uint256 | The zero leaf at the specified level. |

### enqueue

```solidity
function enqueue(uint256 _leaf) public returns (uint256 leafIndex)
```

Add a leaf to the queue for the current subtree.

#### Parameters

| Name   | Type    | Description      |
| ------ | ------- | ---------------- |
| \_leaf | uint256 | The leaf to add. |

#### Return Values

| Name      | Type    | Description                         |
| --------- | ------- | ----------------------------------- |
| leafIndex | uint256 | The index of the leaf in the queue. |

### \_enqueue

```solidity
function _enqueue(uint256 _leaf, uint256 _level) internal
```

Updates the queue at a given level and hashes any subroots
that need to be hashed.

#### Parameters

| Name    | Type    | Description                           |
| ------- | ------- | ------------------------------------- |
| \_leaf  | uint256 | The leaf to add.                      |
| \_level | uint256 | The level at which to queue the leaf. |

### fill

```solidity
function fill() public
```

Fill any empty leaves of the current subtree with zeros and store the
resulting subroot.

### \_fill

```solidity
function _fill(uint256 _level) internal virtual
```

A function that queues zeros to the specified level, hashes,
the level, and enqueues the hash to the next level.

#### Parameters

| Name    | Type    | Description                        |
| ------- | ------- | ---------------------------------- |
| \_level | uint256 | The level at which to queue zeros. |

### insertSubTree

```solidity
function insertSubTree(uint256 _subRoot) public
```

Insert a subtree. Used for batch enqueues.

### calcMinHeight

```solidity
function calcMinHeight() public view returns (uint256 depth)
```

Calculate the lowest possible height of a tree with
all the subroots merged together.

#### Return Values

| Name  | Type    | Description                                       |
| ----- | ------- | ------------------------------------------------- |
| depth | uint256 | The lowest possible height of a tree with all the |

### mergeSubRoots

```solidity
function mergeSubRoots(uint256 _numSrQueueOps) public
```

Merge all subtrees to form the shortest possible tree.
This function can be called either once to merge all subtrees in a
single transaction, or multiple times to do the same in multiple
transactions.

#### Parameters

| Name            | Type    | Description                                                                                                                                                                                                                                                                                                                              |
| --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_numSrQueueOps | uint256 | The number of times this function will call queueSubRoot(), up to the maximum number of times necessary. If it is set to 0, it will call queueSubRoot() as many times as is necessary. Set this to a low number and call this function multiple times if there are many subroots to merge, or a single transaction could run out of gas. |

### queueSubRoot

```solidity
function queueSubRoot(uint256 _leaf, uint256 _level, uint256 _maxDepth) internal
```

Queues a subroot into the subroot tree.

#### Parameters

| Name       | Type    | Description                         |
| ---------- | ------- | ----------------------------------- |
| \_leaf     | uint256 | The value to queue.                 |
| \_level    | uint256 | The level at which to queue \_leaf. |
| \_maxDepth | uint256 | The depth of the tree.              |

### merge

```solidity
function merge(uint256 _depth) public returns (uint256 root)
```

Merge all subtrees to form a main tree with a desired depth.

#### Parameters

| Name    | Type    | Description                                                                          |
| ------- | ------- | ------------------------------------------------------------------------------------ |
| \_depth | uint256 | The depth of the main tree. It must fit all the leaves or this function will revert. |

#### Return Values

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| root | uint256 | The root of the main tree. |

### getSubRoot

```solidity
function getSubRoot(uint256 _index) public view returns (uint256 subRoot)
```

Returns the subroot at the specified index. Reverts if the index refers
to a subtree which has not been filled yet.

#### Parameters

| Name    | Type    | Description        |
| ------- | ------- | ------------------ |
| \_index | uint256 | The subroot index. |

#### Return Values

| Name    | Type    | Description                         |
| ------- | ------- | ----------------------------------- |
| subRoot | uint256 | The subroot at the specified index. |

### getSmallSRTroot

```solidity
function getSmallSRTroot() public view returns (uint256 smallSubTreeRoot)
```

Returns the subroot tree (SRT) root. Its value must first be computed
using mergeSubRoots.

#### Return Values

| Name             | Type    | Description   |
| ---------------- | ------- | ------------- |
| smallSubTreeRoot | uint256 | The SRT root. |

### getMainRoot

```solidity
function getMainRoot(uint256 _depth) public view returns (uint256 mainRoot)
```

Return the merged Merkle root of all the leaves at a desired depth.

_merge() or merged(\_depth) must be called first._

#### Parameters

| Name    | Type    | Description                                                                              |
| ------- | ------- | ---------------------------------------------------------------------------------------- |
| \_depth | uint256 | The depth of the main tree. It must first be computed using mergeSubRoots() and merge(). |

#### Return Values

| Name     | Type    | Description                |
| -------- | ------- | -------------------------- |
| mainRoot | uint256 | The root of the main tree. |

### getSrIndices

```solidity
function getSrIndices() public view returns (uint256 next, uint256 current)
```

Get the next subroot index and the current subtree index.
