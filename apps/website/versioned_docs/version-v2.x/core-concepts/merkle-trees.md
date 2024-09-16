---
title: Merkle Trees
description: A short introduction of the main primitives used by MACI
sidebar_label: Merkle Trees
sidebar_position: 5
---

MACI uses different types of merkle trees to store and manage data. On chain, a [LazyIMT](https://github.com/privacy-scaling-explorations/zk-kit.solidity/tree/main/packages/lazy-imt) is used to store user's state leaves, and an [AccQueue](https://github.com/privacy-scaling-explorations/maci/blob/dev/packages/contracts/contracts/trees/AccQueue.sol) to store user's messages.

## Accumulator queue

This contract holds [messages](/docs/developers-references/smart-contracts/Poll#publishmessage) sent by users. When a leaf is inserted into the `AccQueue`, the merkle root is not updated yet, instead the leaf is updated or the root of a subtree is re-computed. The smart contract exposes three functions:

- `enqueue(leaf)`: Enqueues a leaf into a subtree
  four out of five times it is invoked, an enqueue operation may or may not require the contract to perform a hash function. When it does, only up to $t_d$ required number of hashes need to be computed
- `mergeSubRoots()`: Merge all subtree roots into the shortest possible Merkle tree to fit
  Before computing the main Merkle root, it is necessary to compute the smallSRTroot (the smallest subroot tree root). This is the Merkle root of a tree which is small enough to fit all the subroots
  function which allows the coordinator to specify the number of queue operations to execute. The entire tree may be merged in a single transaction, or it may not.
- `merge()`: Calculate the Merkle root of all the leaves at height $d_t$

## LazyIMT

A LazyIMT is a Merkle tree that is updated lazily. It is used to [store the state leaves](/docs/developers-references/smart-contracts/MACI#signup) of the users. The "lazy" tree performs the minimum number of hashes necessary to insert elements in a tree. This means if there is only a left element the parent hash is not calculated until a corresponding right element exists, to avoid having an intermediate hash that will change in the future. This tree is designed for roots that are infrequently accessed onchain.
