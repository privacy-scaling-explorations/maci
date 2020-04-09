# `maci-core`

This submodule assists with handling key business logic functions and
processes.

## Overview

One may conceive of MACI as a state machine with 1) data and 2) functions which
transform said data. This makes it easier to reason about the system, write
tests, and implement functionality. It also allows us to implement the smart
contracts in discrete components which are easy to test.

To this end, we this submodule exposes a `MaciState` class and a `User` class.

## **`User`**

Each `User object has the following attributes:

`pubKey: PubKey`: The user's public key.

`votes: SnarkBigInt[]`: The voice credits assigned to each vote option. 

`voiceCreditBalance: SnarkBigInt`: The user's remaining voice credit balance.

### Functions

#### **`genStateLeaf`**

Function signature:

```ts
(_voteOptionTreeDepth: number): StateLeaf
```

Generates and returns an equivalent `StateLeaf` [domain
object](../domainobjs/). This function helps `MaciState` to generate a state
tree.

#### **`copy`**

Function signature:

```ts
(): User
```

Deep-copies and returns this object.

## `MaciState`

We denote all state data as attributes of a `MaciState` object.

Only the coordinator should have access to state data. Each user can only
access their own keypair, commands, and on-chain state and message tree roots.

`MaciState` contains the following attributes:

`coordinatorKeypair: Keypair`: The coordinator's keypair.

`users: User[]`: An array of `User` objects, each of which represents the current state of a user.

`stateTreeDepth: SnarkBigInt`: The depth of the state tree.

`messageTreeDepth: SnarkBigInt`: The depth of the message tree.

`voteOptionTreeDepth: SnarkBigInt`: The depth of each user's vote option tree.

`messages: Message[]`: An array of all published messages.

`zerothStateLeaf: StateLeaf`: The leaf of the state tree at index 0. This means
that the zeroth user in `users` has index 1 in the state tree.

`maxVoteOptionIndex: SnarkBigInt`: The maximum allowed vote options. For
instance, even if the vote option tree supports up to 16 vote options, this
value can be set to 12 so as to enforce the fact that there are only 12 options
to choose from.

`encPubKeys: PubKey[]`: An array of public keys used to generate ephermeral
ECDH shared keys with which to encrypt commands to messages. For each `PubKey`
in `encPubKey`, its corresponding `Message` in `messages` shares the same array
index.

### Functions

The following functions modify the state:

- `signUp()`
- `publishMessage()`
- `processMessage()`
- `batchProcessMessage()`

The following functions do not modify the state:

- `copy()`
- `genStateTree()`
- `genStateRoot()`
- `genMessageTree()`
- `genMessageRoot()`
- `computeCumulativeVoteTally()`
- `genUpdateStateTreeCircuitInputs()`
- `genBatchUpdateStateTreeCircuitInputs()`

#### **`signUp`**

Function signature:

```ts
(
    _pubKey: PubKey,
    _initialVoiceCreditBalance: SnarkBigInt,
): void
```

Appends a `User` with the specified public key and initial voice credit balance
to the `users` array.

#### **`publishMessage`**

Function signature:

```ts
(
    _message: Message,
    _encPubKey: PubKey,
): void
```

Appends a `Message` to the `messages` array. It also appends the public key
used to generate the ECDH shared key which encrypts `_message` to the
`encPubKeys` array.

#### **`processMessage`**

Function signature:

```ts
(_index: number): void
```

This function:

1. Generates a shared key using `encPubKeys[index]` and `coordinatorKeyPair.pubKey`
2. Decrypts `messages[_index]` to derive a `Command`
3. If the message is invalid, do nothing and return
4. If the message is valid, update the user's public key and vote at `_index`.

#### **`batchProcessMessage`**

Function signature:

```ts
(
    _index: number,
    _batchSize: number,
    _randomStateLeaf: StateLeaf,
): void
```

This function runs `processMessage()` on a batch of `_batchSize` leaves
starting from index `_index`, and then replaces the zeroth leaf with
`_randomStateLeaf`.


**`genStateTree()`**

Function signature:

```ts
(): IncrementalMerkleTree
```

Generates and returns the state tree as an incremental Merkle tree.

**`genStateRoot()`**

Function signature:

```ts
(): SnarkBigInt
```

This function computes the state root given the data stored in `users` and
`zerothStateLeaf`.

**`genMessageTree()`**

Function signature:

```ts
(): IncrementalMerkleTree
```

Generates and returns the message tree as an incremental Merkle tree.

**`genMessageRoot()`**

Function signature:

```ts
(): SnarkBigInt
```

This function computes the state root given the data stored in `messsages`.

**`genUpdateStateTreeCircuitInputs`**

Function signature:

```ts
genUpdateStateTreeCircuitInputs = (_index: number): object
```

Generates the circuit inputs (both public and private) for the
`UpdateStateTree` circuit, as an object with the following attributes:

- `coordinator_public_key`
- `ecdh_private_key`
- `ecdh_public_key`
- `message`
- `msg_tree_root`
- `msg_tree_path_elements`
- `msg_tree_path_index`
- `vote_options_leaf_raw`
- `vote_options_tree_root`
- `vote_options_tree_path_elements`
- `vote_options_tree_path_index`
- `vote_options_max_leaf_index`
- `state_tree_data_raw`
- `state_tree_max_leaf_index`
- `state_tree_root`
- `state_tree_path_elements`
- `state_tree_path_index`

**`genBatchUpdateStateTreeCircuitInputs`**

Function signature:

```ts
genBatchUpdateStateTreeCircuitInputs = (
        _index: number,
        _batchSize: number,
        _randomStateLeaf: StateLeaf,
) => object
```

Generates the circuit inputs (both public and private) for the
`BatchUpdateStateTree` circuit, as an object with the following attributes:

- `coordinator_public_key`
- `message`
- `ecdh_private_key`
- `ecdh_public_key`
- `msg_tree_root`
- `msg_tree_path_elements`
- `msg_tree_batch_start_index`
- `random_leaf`
- `state_tree_root`
- `state_tree_path_elements`
- `state_tree_path_index`
- `random_leaf_root`
- `random_leaf_path_elements`
- `vote_options_leaf_raw`
- `state_tree_data_raw`
- `state_tree_max_leaf_index`
- `vote_options_max_leaf_index`
- `vote_options_tree_root`
- `vote_options_tree_path_elements`
- `vote_options_tree_path_index`

**`genQuadVoteTallyCircuitInputs`**

Function signature:

```ts
genQuadVoteTallyCircuitInputs = (
    _startIndex: SnarkBigInt,
    _batchSize: SnarkBigInt,
    _currentResultsSalt: SnarkBigInt,
    _newResultsSalt: SnarkBigInt,
): object
```

Generates the circuit inputs (both public and private) for the
`QuadVoteTally` circuit, as an object with the following attributes:

- `voteLeaves`
- `stateLeaves`
- `currentResults`
- `fullStateRoot`
- `currentResultsSalt`
- `newResultsSalt`
- `currentResultsCommitment`
- `intermediatePathElements`
- `intermediatePathIndex`
- `intermediateStateRoot`

**`copy()`**

Function signature:

```ts
(): MaciState
```

This function returns a deep-copied `MaciState` object.
