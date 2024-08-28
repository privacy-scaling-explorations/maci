---
title: MACI Poll Joining Circuit
description: Introduction to the core zk-SNARK circuits of MACI
sidebar_label: Poll Joining Circuits
sidebar_position: 5
---

#### Poll Joining Circuit

[**Repo link**](https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/core)

The [`pollJoining`](https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/core/qv/pollJoining.circom) circuit allows the users to prove that they are allowed to join the Poll based on their MACI key. The circuit checks:

- That the Poll joining nullifier nullifier is correctly computed as a hash of a MACI private key associated with a leaf of the MACI state tree.
- That the MACI public key, derived from the private key, is included in the MACI state tree
- The knowledge of a private key associated with the new poll public key
- That the new credit balance associated with the new key is less then or equal to the original credit balance found in the MACI state leaf.

The nullifier is computed as a Poseidon hash of the user's MACI private key.

#### Parameters

| #   | Parameter        | Description             |
| --- | ---------------- | ----------------------- |
| 0   | State tree depth | Allows $(2^{n})$ joins. |

#### Inputs

    // The state leaf and related path elements.
    signal input stateLeaf[STATE_LEAF_LENGTH];
    // Siblings
    signal input siblings[stateTreeDepth][STATE_TREE_ARITY - 1];
    // Indices
    signal input indices[stateTreeDepth];
    // User's hashed private key
    signal input nullifier;
    // User's credits for poll joining (might be <= oldCredits)
    signal input credits;
    // MACI State tree root which proves the user is signed up
    signal input stateRoot;
    // The actual tree depth (might be <= stateTreeDepth) Used in BinaryMerkleRoot
    signal input actualStateTreeDepth;
    // Public input hash (nullifier, credits, stateRoot)
    signal input inputHash;

| Input signal           | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| `privKey`              | User's MACI private key                                                 |
| `pollPrivKey`          | The new Poll private key                                                |
| `pollPubKey`           | User's MACI private key                                                 |
| `stateLeaf`            | The value of the leaf associated with the user int the MACI State tree  |
| `siblings`             | The Merkle path siblings in the MACI State tree                         |
| `indices`              | The Merkle path indices in the MACI State tree                          |
| `nullifier`            | Hash of user's MACI private key                                         |
| `credits`              | User's new credit balance in the Poll state leaf                        |
| `stateRoot`            | MACI State tree root                                                    |
| hash                   |
| `actualStateTreeDepth` | Actual MACI state tree depth (related to Lazy Merkle Tree optimization) |
| `inputHash`            | he SHA256 hash of inputs supplied by the contract                       |

##### `inputHash`

All inputs to this circuit are private except for `inputHash`. To save gas during verification, the `Poll` contract hashes the following values using SHA256 and uses the hash as the sole element of $ic$:

1. `nullifier`
2. `credits`
3. `stateRoot`
4. `pollPubKey[0]`
5. `pollPubKey[1]`
