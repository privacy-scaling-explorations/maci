# `maci-core`

[![NPM Package][core-npm-badge]][core-npm-link]
[![Actions Status][core-actions-badge]][core-actions-link]

This submodule assists with handling key business logic functions and
processes.

## Overview

One may conceive of MACI as a state machine with 1) data and 2) functions which
transform said data. This makes it easier to reason about the system, write
tests, and implement functionality. It also allows us to implement the smart
contracts in discrete components which are easy to test.

To this end, this submodule exposes a `MaciState` class and a `Poll` class.
Developers should instantiate objects from these classes to test MACI. For
instance, [`MACI.test.ts`](`../contracts/ts/__tests__/MACI.test.ts`) creates a
`MaciState` object and every time it interacts with the MACI smart contract, it
mirrors said interaction on the `MaciState` and `Poll`. As such, the developer
can then use their helper functions like `maciState.signUp()`,
`poll.publishMessage`, `poll.processMessages()`, and `poll.tallyVotes()` to
step through the various stages of the MACI flow.

## `MaciState`

### Key functions

#### **`signUp`**

Accepts a user's public key and creates a new state leaf and ballot leaf.

In testing, whenever a test suite submits a `signUp()` transaction, it should
call `maciState.signUp()` as well, so that the off-chain representation of MACI
is kept up to date.

In production, `genMaciStateFromContract()` in
[`genMaciState.ts`](`contracts/ts/genMaciState.ts`) uses this function when it
scans a MACI contract's event log for signups, so as to bring its `MaciState`
instance up to date.

#### **`deployPoll`**

Creates a new `Poll`. This should be done whenever the MACI contract's
`deployPoll()` function is called.

### Helper functions

#### **`copy`**

A function that deep-copies an object.

### Key data structures

#### **`stateAq`**, **`stateTree`**

The Merkle tree of state leaves. `stateAq` must be merged (subroots and/or main
root) whenever the MACI contract's `mergeStateAqSubRoots()` and
`mergeStateAq()` are invoked.

They should contain the same leaves, even if the `stateAq` is not yet merged.
`stateTree` exists for developer convenience.

## **`Poll`**

A `Poll` is an off-chain representation of a Poll. In testing, `Poll` instances
should mirror their on-chain counterparts.

### Key functions

#### **`publishMessage`**

Publishes a message by updating the message tree and message accumulation
queue.

#### **`processMessages`**

Processes a batch of messages and returns the inputs to the `processMessages`
circuit which can be used to prove correct execution.

#### **`tallyVotes`**

Tallies a batch of votes and returns the inputs to the `tallyVotes`
circuit which can be used to prove correct execution.

### Helper functions

#### **`copy`**

Deep-copies and returns this object.

### Key data structures

#### **`messageAq`**, **`messageTree`**

The Merkle tree of message leaves. `messageAq` must be merged (subroots and/or
main root) whenever the MACI contract's `mergeMessageAqSubRoots()` and
`mergeMessageAq()` are invoked.

They should contain the same leaves, even if the `messageAq` is not yet merged.
`messageTree` exists for developer convenience.

[core-npm-badge]: https://img.shields.io/npm/v/maci-core.svg
[core-npm-link]: https://www.npmjs.com/package/maci-core
[core-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/core-build.yml/badge.svg
[core-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Acore
