---
title: MACI Poll Circuits
description: Introduction to the core zk-SNARK circuits of MACI
sidebar_label: Join Poll Circuit
sidebar_position: 6
---

[**Repo link**](https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/voter)

## PollJoining

Users need to provide a valid proof to the Poll smart contract to join a poll, allowing to vote on it. The circuit ensures that they signup to all polls with the same MACI public key, as well as that they can prove being included in MACI's state tree.

#### Parameters

| #   | Parameter        | Description               |
| --- | ---------------- | ------------------------- |
| 0   | State tree depth | Allows $(2^{n})$ signups. |

#### Inputs

| Input signal           | Description                                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `privateKey`           | The user's private key                                                                                                                                                             |
| `pollPubKey`           | The poll's public key                                                                                                                                                              |
| `siblings`             | The siblings for the merkle tree inclusion proof                                                                                                                                   |
| `indices`              | The indices for the merkle tree inclusion proof                                                                                                                                    |
| `nullifier`            | The nullifier                                                                                                                                                                      |
| `stateRoot`            | The MACI state tree root                                                                                                                                                           |
| `actualStateTreeDepth` | The actual tree depth (might be less or equal to stateTreeDepth), used by the [LeanIMT structure](https://github.com/privacy-scaling-explorations/zk-kit/tree/main/papers/leanimt) |
| `pollId`               | The poll id                                                                                                                                                                        |

## PollJoined

Users will use this circuit to anonymously prove that they joined a poll. This can be used to authenticate to the relayer service, to reduce spam.

#### Parameters

| #   | Parameter        | Description               |
| --- | ---------------- | ------------------------- |
| 0   | State tree depth | Allows $(2^{n})$ signups. |

#### Inputs

| Input signal           | Description                                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `privateKey`           | The user's private key                                                                                                                                                             |
| `voiceCreditsBalance`  | The user's initial voice credits balance                                                                                                                                           |
| `pathElements`         | The path elements for the merkle tree inclusion proof                                                                                                                              |
| `pathIndices`          | The path indices for the merkle tree inclusion proof                                                                                                                               |
| `stateRoot`            | The MACI state tree root                                                                                                                                                           |
| `actualStateTreeDepth` | The actual tree depth (might be less or equal to stateTreeDepth), used by the [LeanIMT structure](https://github.com/privacy-scaling-explorations/zk-kit/tree/main/papers/leanimt) |
