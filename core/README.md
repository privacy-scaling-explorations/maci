# `maci-core`

This submodule assists with handling key business logic functions and
processes.

## Overview

We conceive of MACI as a state machine with data and functions which transform
said data. This makes it easier to reason about the system, write tests, and
implement functionality. It also allows us to implement the smart contracts in
discrete components which are easy to test.

TODO: change this to document the objects, not pseudocode

Note that the actual implementation uses objects instead of pure functions.
This avoids duplication of code which copies state data.

### State data

We denote all state data as attributes of a `MaciState` object.

Only the coordinator should have access to state data. Each user can only
access their own keypair, commands, and on-chain state and message tree roots.

`MaciState` contains the following attributes:

```ts
{
    coordinatorKeypair: Keypair
    stateTreeDepth: SnarkBigInt
    messageTreeDepth: SnarkBigInt
    voteOptionTreeDepth: SnarkBigInt
    zerothStateLeaf: SnarkBigInt
    messages: Message[]
    users: User[]
}
```

- `coordinatorKeypair`: The coordinator's keypair.
- `stateTreeDepth:`: The depth of the state tree.
- `messageTreeDepth:`: The depth of the message tree.
- `voteOptionTreeDepth:`: The depth of each user's vote option tree.
- `zerothStateLeaf`: The value of the zeroth leaf of the state tree. There
  should not be any known `StateLeaf` preimage for it as it is just a random
  value.
- `encPubKeys`: An array of `PubKey` objects used to generate ephermeral ECDH
  shared keys with which to encrypt commands to messages. For each `PubKey` in
  `encPubKey`, its corresponding `Message` in `messages` shares the same array
  index.
- `messages`: An array of all published `Message` objects
- `users`: An array of `User` objects.


Each `User object has the following attributes:

```ts
{
    index: SnarkBigInt,
    pubKey: PubKey,
    votes: SnarkBigInt[],
    voiceCreditBalance: SnarkBigInt,
}
```

### Functions

The following functions modify the state:

- `signUp()`
- `publishMessage()`
- `processMessage()`

The following functions do not modify the state:

- `genStateRoot()`
- `genMessageRoot()`
- `copy()`

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
public publishMessage = (
    _message: Message,
    _encPubKey: PubKey,
): void
```

Appends a `Message` to the `messages` array. It also appends the public key
used to generate the ECDH shared key which encrypts `_message` to the
`encPubKeys` array.

#### **`processMessage`**

```ts
processMessage = (
    _index: number,
    _randomZerothStateLeaf: SnarkBigInt,
): void
```

This function:

1. Generates a shared key using `encPubKeys[index]` and `coordinatorKeyPair.pubKey`
2. Decrypts `messages[_index]` to derive a `Command`
3. If the message is invalid, do nothing and return
4. If the message is valid, update the user's public key and vote at `_index`.
