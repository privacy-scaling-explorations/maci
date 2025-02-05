---
title: Merkle Trees
description: A short introduction of the main primitives used by MACI
sidebar_label: Merkle Trees
sidebar_position: 5
---

MACI uses different types of merkle trees to store and manage data. LeanIMT to store MACI public keys in the MACI contract and [LazyIMT](https://github.com/privacy-scaling-explorations/zk-kit.solidity/tree/main/packages/lazy-imt) is used to store user's state leaves for each poll.

## LazyIMT

A LazyIMT is a Merkle tree that is updated lazily. It is used to [store the state leaves](/docs/technical-references/smart-contracts/MACI#signup) of the users. The "lazy" tree performs the minimum number of hashes necessary to insert elements in a tree. This means if there is only a left element the parent hash is not calculated until a corresponding right element exists, to avoid having an intermediate hash that will change in the future. This tree is designed for roots that are infrequently accessed onchain.
