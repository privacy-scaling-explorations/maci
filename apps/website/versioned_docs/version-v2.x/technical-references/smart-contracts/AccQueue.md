---
title: AccQueue Smart Contract
description: AccQueue smart contract
sidebar_label: AccQueue
sidebar_position: 1
---

:::info
Code location: [AccQueue.sol](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/trees/AccQueue.sol)
:::

The AccQueue contract represents a Merkle Tree where each leaf insertion only updates a subtree. To obtain the main tree root, the subtrees must be merged together by the contract owner. This requires at least two operations, a `mergeSubRoots` and a `merge`.

The contract can be initialized to work as a traditional Merkle Tree (2 leaves per node) or a Quinary Tree (5 leaves per node). This can be achieved by passing either two or five as parameter to the constructor (`_hashLength`). Any other values should not be accepted.

Below are presented the most important functions of the smart contract:

- `enqueue` - Allows to add a leaf to the queue for the current subtree. Only one parameter is accepted and that is the leaf to insert.
- `insertSubTree` - Admin only function which allows to insert a full subtree (batch enqueue)
- `mergeSubRoots` - Allows the contract owner to merge all of the subtrees to form the shortest possible tree. The argument `_numSrQueueOps` can be used to perform the operation in multiple transactions (as this might trigger the block gas limit).
- `merge` - Allows the contract admin to form a main tree with the desired depth. The depth must fit all of the leaves.
