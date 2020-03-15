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

We denote all state data as `MaciState`.

Only the coordinator should access `MaciState`. Each user can only access their
own keypair, commands, and on-chain state and message tree roots.

`MaciState` contains the following:

```ts
{
    coordinatorKeypair: Keypair,
    users: User[],
    messages: Message[],
    encPubKeys: PubKey[],
    zerothStateLeaf: SnarkBigInt,
}
```

#### **`coordinatorKeypair`**

The coordinator's keypair.

#### **`users`**

An array of `User` dicts with the following structure:

```ts
{
    index: SnarkBigInt,
    pubKey: PubKey,
    votes: SnarkBigInt[],
    voiceCreditBalance: SnarkBigInt,
}
```

#### **`messages`**

An array of all published messages.

#### **`encPubKeys`**

An array of all public keys used to generate ephermeral ECDH shared keys with
which to encrypt commands to messages. For each `PubKey` in `encPubKey`, its
corresponding `Message` in `messages` shares the same array index.

#### **`zerothStateLeaf:`**

The value of the zeroth leaf of the state tree. There should not be any known
`StateLeaf` preimage for it as it is just a random value.

### Functions

The following function descriptions use the following format:

```haskell
arg_1: Type_1 ->
...
arg_n: Type_n ->
output: Type
```

where `arg_` to `arg_n` are arguments to a function which returns `output`.

#### **`signUp`**

Function signature:

```haskell

pubKey: PubKey -> 
initialVoiceCreditBalance: SnarkBigInt -> 
oldState: MaciState -> 
newState: MaciState
```

Appends a `User` with the specified public key and initial voice credit balance
to `oldState` to generate `newState`.

#### **`publishMessage`**

Function signature:

```haskell
message: Message ->
encPubKey: PubKey ->
oldState: MaciState ->
newState: MaciState
```

Appends a message to the `messages` array of `oldState` to generate `newState`.

#### **`processMessage`**

```haskell
index: number ->
oldState: MaciState ->
newState: MaciState
```

1. Generates a shared key using `encPubKey` and `oldState.coordinatorKeyPair.pubKey`
2. Decrypts the message to derive a `Command`
3. Updates `oldState` to derive `newState`
