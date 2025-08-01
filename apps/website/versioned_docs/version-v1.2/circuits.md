---
title: MACI Circuits
description: Introduction to the core zk-SNARK circuits of MACI
sidebar_label: Circuits
sidebar_position: 9
---

# zk-SNARKS in MACI

MACI uses zk-SNARKs to essentially hide how each person voted while still revealing the final vote result. This gives voters privacy and helps reduce bribery while still ensuring that the final results were tallied correctly off-chain.

## MACI Circuits

MACI has three main zk-SNARK [circuits](https://github.com/privacy-scaling-explorations/maci/tree/main/circuits):

1. [`ProcessMessages.circom`](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/processMessages.circom), which takes a batch of encrypted messages, decrypts them, and generates a proof that the coordinator's local processing was performed correctly.
2. [`TallyVotes.circom`](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/tallyVotes.circom), which counts votes from users' ballots, batch by batch.
3. [`Subsidy.circom`](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/subsidy.circom), which implements [pairwise subsidy](https://hackmd.io/@chaosma/H1_9xmT2K). Please note this is an optional feature.

The rest of the circuits are utilities templates that are required for the main circuits to work correctly. These include utilities such as float math, conversion of private keys, and Poseidon hashing/encryption.

Each circuit is parameterised and it is important to set the right parameters that match your use case. For example, if you want to support up to 3125 messages, the message tree depth parameter should be set to `5` (as $5^5 = 3125$).

## Background

### zk-SNARKs

zk-SNARKs are a type of zero-knowledge proof which allows a "prover" to prove to a "verifier" that they know a secret without revealing the secret itself. In MACI, the prover is the coordinator. MACI uses zk-SNARKs to prove that the coordinator has correctly processed the batches of messages and that all votes have been tallied correctly. A smart contract acts as the verifier to check the proof from the coordinator. Users can also verify that the process was done correctly at any point after the proof generation.

### Circom

MACI's circuits are written using [Circom](https://docs.circom.io/), a domain-specific language (DSL) used to write zk-SNARK circuits. Circom syntax resembles JavaScript, and it currently is one of the most popular DSL in use by zk developers. Please refer to their documentation to learn more about the language.

### Proving system

MACI uses [Groth16](https://eprint.iacr.org/2016/260.pdf) as its proving system. Groth16 is a zk-SNARK proving system that allows for the generation of proofs that are small and fast to verify.

## How are the circuits used?

The circuits are used by the coordinator (the prover) to prove that they have correctly processed a batch of messages and tallied the votes correctly. This happens after a Poll has completed, and the coordinator has merged the state and message trees. The coordinator then generates a proof for each batch of messages, and submits them to the contract. The contract then verifies the proofs and updates the commitments on chain.

## How do the Circuits fit in a voting round?

![flow](/img/circuits/processingAfterPollEnds.svg)

## How do the circuits work?

### Message processing ([`processMessages`](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/processMessages.circom))

This circuit allows the coordinator to prove that they have correctly processed each message in reverse order, in a consecutive batch of 5 ^ msgBatchDepth messages to the respective state leaf within the state tree. Coordinators would use this circuit to prove correct execution at the end of each Poll.

The `processMessages` circuit will try to decrypt the messages, and based on the content of the message, update within itself the trees, to generate a proof that the coordinator's off-chain processing was done correctly. In other words, the circuit takes a final state, an initial state, and the leaves (messages and user signups) - it processes these messages via the different state transitions to finally check that the expected state is correct.
The pre-requisites for this circuit are:

- the related Poll has ended
- the state tree has been merged
- the message tree has been merged

This circuit requires the coordinator's private key, hence a proof for this circuit can only be generated by the coordinator. The private key is needed in order to generate the ECDH shared key used to decrypt the messages.

![ProcessMessages](/img/circuits/processMessages.svg)

:::info
A version working with non quadratic voting (non-qv) is also available. This version is called `processMessagesNonQV` and is to be used when the Poll is not using the quadratic voting feature. Note that by default MACI works with quadratic voting.
:::

#### Parameters

| #   | Parameter                | Description                                          |
| --- | ------------------------ | ---------------------------------------------------- |
| 0   | State tree depth         | Allows $(5^{n})$ signups.                            |
| 1   | Message tree depth       | Allows $(5^{n})$ votes or key-change messages.       |
| 2   | Message batch tree depth | Allows $(5^{n})$ messages to be processed per batch. |
| 3   | Vote option tree depth   | Allows $(5^{n})$ vote options.                       |

#### Inputs

| Input signal                     | Description                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `inputHash`                      | The SHA256 hash of inputs supplied by the contract                                      |
| `packedVals`                     | Described below                                                                         |
| `pollEndTimestamp`               | The Unix timestamp at which the poll ends                                               |
| `msgRoot`                        | The root of the message tree                                                            |
| `msgs`                           | The batch of messages as an array of arrays                                             |
| `msgSubrootPathElements`         | Described below                                                                         |
| `coordinatorPubKeyHash`          | $poseidon_2([cPk_x, cPk_y])$                                                            |
| `newSbCommitment`                | Described below                                                                         |
| `coordPrivKey`                   | The coordinator's private key                                                           |
| `coordPubKey`                    | The coordinator's public key                                                            |
| `encPubKeys`                     | The public keys used to generate shared ECDH encryption keys to encrypt the messages    |
| `currentStateRoot`               | The state root before the commands are applied                                          |
| `currentStateLeaves`             | The state leaves upon which messages are applied                                        |
| `currentStateLeavesPathElements` | The Merkle path to each incremental state root                                          |
| `currentSbCommitment`            | Described below                                                                         |
| `currentSbSalt`                  | Described below                                                                         |
| `newSbCommitment`                | Described below                                                                         |
| `newSbSalt`                      | Described below                                                                         |
| `currentBallotRoot`              | The root of the ballot tree before messages are applied                                 |
| `currentBallots`                 | The ballots upon which ballots are applied                                              |
| `currentBallotsPathElements`     | The Merkle path to each incremental ballot root                                         |
| `currentVoteWeights`             | The existing vote weight for the vote option in the ballot which each command refers to |
| `currentVoteWeightsPathElements` | The Merkle path from each vote weight to the vote option root in its ballot             |

##### `inputHash`

All inputs to this circuit are private except for `inputHash`. To save gas during verification, the `MessageProcessor` contract hashes the following values using SHA256 and uses the hash as the sole element of $ic$:

1. `packedVals`
2. `coordinatorPubKeyHash`
3. `msgRoot`
4. `currentSbCommitment`
5. `newSbCommitment`
6. `pollEndTimestamp`

The hash is computed using the `sha256` Solidity function and is then subject to modulo $p$.

##### `packedVals`

`packedVals` is the following values represented as one field element. Consider that a field element is roughly 253 bits. The big-endian bit-representation is as such:

| Bits        | Value                      |
| ----------- | -------------------------- |
| 1st 53 bits | `0`                        |
| 2nd 50 bits | `batchEndIndex`            |
| 3rd 50 bits | `currentMessageBatchIndex` |
| 4th 50 bits | `numSignUps`               |
| 5th 50 bits | `maxVoteOptions`           |

For instance, if `maxVoteOptions` is 25 and `batchEndIndex` is `5`, and all other values are 0, the following is the `packedVals` representation in hexadecimal:

`140000000000000000000000000000000000019`

##### `currentSbCommitment` and `newSbCommitment`

The `currentSbCommitment` is the $poseidon_3$ hash of the state tree root, the ballot tree root, and a random salt. The purpose of the random salt, which should be unique to each batch, is to ensure that the value of `currentSbCommitment` always changes even if all the commands in a batch are invalid and therefore do not change the state tree or ballot tree root.

The result of applying a batch of messages to `currentSbCommitment` is `newSbCommitment`.

##### `currentSbSalt`

The salt used to produce `currentSbCommitment` (see above).

##### `newSbSalt`

The salt used to produce `newSbCommitment` (see above).

##### `msgSubrootPathElements`

The index of each message in `msgs` is consecutive. As such, in order to prove that each message in `msgs` is indeed a leaf of the message tree, we compute the subtree root of `msgs`, and then verify that the subtree root is indeed a subroot of `msgRoot`.

A simplified example using a tree of arity 2:

```
             r
           /  \
          s    ...
       /    \
      o     o
     / \   / \
   a   b  c  d
```

To prove that `a...d` are leaves of the tree with root `r`, we prove that the leaves have the subroot `s` with depth 2, and _then_ prove that `s` is a member of `r` at depth 1.

The implementation for this is in the `QuinBatchLeavesExists` circuit in `https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/trees/incrementalQuinTree.circom`.

This method requires fewer circuit constraints than if we verified a Merkle proof for each leaf.

#### Statements that the circuit proves

1. That the prover knows the preimage to `inputHash` (see above)
2. That the prover knows the preimage to `currentSbCommitment` (that is, the state root, ballot root, and `currentSbSalt`)
3. That `maxVoteOptions <= (5 ^ voteOptionTreeDepth)`
4. That `numSignUps <= (5 ^ stateTreeDepth)`
5. That `coordPubKey` is correctly derived from `coordPrivKey`
6. That `coordPubKey` is the preimage to the Poseidon hash of `coordPubKey` (provided by the contract)
7. That each message in `msgs` exists in the message tree
8. That after decrypting and applying each message, in reverse order, to the corresponding state and ballot leaves, the new state root, new ballot root, and `newSbSalt` are the preimage to `newSbCommitment`

### Tally Votes ([`tallyVotes`](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/tallyVotes.circom))

#### Parameters

| #   | Parameter              | Description                                              |
| --- | ---------------------- | -------------------------------------------------------- |
| 0   | State tree depth       | Allows $(5^{n})$ signups.                                |
| 1   | State leaf batch depth | Allows $(5^{n})$ users' votes to be processed per batch. |
| 2   | Vote option tree depth | Allows $(5^{n})$ vote options.                           |

![TallyVotes](/img/circuits/tallyVotes.svg)

:::info
A version working with non quadratic voting (non-qv) is also available. This version is called `tallyVotesNonQv` and is to be used when the Poll is not using the quadratic voting feature. Note that by default MACI works with quadratic voting.
:::

#### Input signals

| Input signal                            | Description                                                      |
| --------------------------------------- | ---------------------------------------------------------------- |
| `inputHash`                             | The SHA256 hash of inputs supplied by the contract               |
| `packedVals`                            | Described below                                                  |
| `sbCommitment`                          | Described below                                                  |
| `currentTallyCommitment`                | Described below                                                  |
| `newTallyCommitment`                    | Described below                                                  |
| `stateRoot`                             | The root of the state tree after all messages have been applied  |
| `ballotRoot`                            | The root of the ballot tree after all messages have been applied |
| `sbSalt`                                | The salt used to produce `sbCommitment`                          |
| `ballots`                               | The ballots in the batch being tallied                           |
| `ballotPathElements`                    | The Merkle path to each ballot leaf                              |
| `votes`                                 | The votes in each ballot cast per result                         |
| `currentResults`                        | The current tally of votes per vote option                       |
| `currentResultsRootSalt`                | A random value                                                   |
| `currentSpentVoiceCreditSubtotal`       | The subtotal of voice credits spent across all vote options      |
| `currentSpentVoiceCreditSubtotalSalt`   | A random value                                                   |
| `currentPerVOSpentVoiceCredits`         | The voice credits spent on each vote option so far               |
| `currentPerVOSpentVoiceCreditsRootSalt` | A random value                                                   |
| `newResultsRootSalt`                    | A random value                                                   |
| `newPerVOSpentVoiceCreditsRootSalt`     | A random value                                                   |
| `newSpentVoiceCreditSubtotalSalt`       | A random value                                                   |

##### `inputHash`

All inputs to this circuit are private except for `inputHash`. To save gas during verification, the `Tally` contract hashes the following values using SHA256 and uses the hash as the sole element of $ic$:

1. `packedVals`
2. `sbCommitment`
3. `currentTallyCommitment`
4. `newTallyCommitment`

The hash is computed using the `sha256` Solidity function and is then subject to modulo $p$.

##### `packedVals`

`packedVals` is the following values represented as one field element. Consider that a field element is roughly 253 bits. The big-endian bit-representation is as such:

| Bits        | Value             |
| ----------- | ----------------- |
| 1st 53 bits | `0`               |
| 2nd 50 bits | `0`               |
| 3rd 50 bits | `0`               |
| 4th 50 bits | `numSignUps`      |
| 5th 50 bits | `batchStartIndex` |

`numSignUps`, a value provided by the contract, is the number of users who have signed up. This is one less than the number of leaves inserted in the state tree (since the 0th state leaf is a blank state leaf). `batchStartIndex` is the ballot tree index at which the batch begins.

For instance, if `numSignUps` is 25 and the batch index is `5`, and all other values are 0, the following is the `packedVals` representation in hexadecimal:

`64000000000005`

##### `sbCommitment`

The commitment to `stateRoot`, `ballotRoot`, and `sbSalt`:

$poseidon_3([stateRoot, ballotRoot, sbSalt])$

Proving preimage of `sbCommitment` is one out of the several steps required to prove that the votes were tallied correctly. By establishing that the coordinator knows `ballotRoot`, the coordinator can (using other parts of the circuit) prove that they know the preimage of the ballot leaves in the batch being tallied.

##### `currentTallyCommitment` and `newTallyCommitment`

A tally is represented by a _tally commitment_, which is the $poseidon_3$ hash of:

1. $tc_r$: a commitment to the votes per option
   - This is the hash of the Merkle root $r_r$ of the votes and a salt $r_s$, computed as $poseidon_2([r_r, r_s])$
2. $tc_t$: a commitment to the total spent voice credits
   - This is the hash of the total spent voice credits $t_c$ and a salt $t_s$, computed as $poseidon_2([t_c, t_s])$
3. $tc_p$: a commitment to the spent voice credits per vote option
   - This is the hash of the Merkle root of the spent voice credits per vote option $p_v$ and a salt $p_s$, computed as $poseidon_2([p_v, p_s])$

The tally commitment is computed as such:

$poseidon_3([tc_r, tc_t, tc_p])$

#### Statements that the circuit proves

1. That the coordinator knows the preimage of `sbCommitment`
2. That the coordinator knows the preimage of `inputHash`
3. That `batchStartIndex` is less than or equal to `numSignUps`
4. That each ballot in `ballots` is in a member of the ballot tree with the Merkle root `ballotRoot` at indices `batchStartIndex` to `batchStartIndex + (5 ** intStateTreeDepth)`
5. That each set of votes (`votes[i]`) has the Merkle root $blt_r$ whose value equals `ballots[i][1]`
6. That the tally is valid, which is:
   - That the sum of votes per vote option is correct

### Subsisdy ([`subsidy`](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/subsidy.circom))

This circuit is an optional feature - it's not required for MACI to function.  
The subsidy circuit is used to implement pairwise subsidy. This is a technique that can be used to detect voters collusion. It currently is not optimized for production and the team will work on a more efficient implementation in the future.

#### Parameters

| #   | Parameter              | Description                                              |
| --- | ---------------------- | -------------------------------------------------------- |
| 0   | State tree depth       | Allows $(5^{n})$ signups.                                |
| 1   | State leaf batch depth | Allows $(5^{n})$ users' votes to be processed per batch. |
| 2   | Vote option tree depth | Allows $(5^{n})$ vote options.                           |

### Utility circuits

#### Process Messages Input Hasher

A utility circuit used by the main `processMessages` circuit to hash its inputs.

![ProcessMessagesInputHasher](/img/circuits/processMessagesInputHasher.svg)

It outputs one field element, which is the SHA256 hash of the following inputs:

1. `packedVals`
2. `pollEndTimestamp`
3. `msgRoot`
4. `coordinatorPubKeyHash`
5. `newSbCommitment`
6. `currentSbCommitment`

#### Tally Votes Input Hasher

A utility template that generates a sha256 hash of the provided tally inputs.

![TallyVotesInputHasher](/img/circuits/tallyInputHasher.svg)

It outputs one field element, which is the SHA256 hash of the following inputs:

1. `packedVals`
2. `sbCommitment`
3. `currentTallyCommitment`
4. `newTallyCommitment`

#### ResultsCommitmentVerifier

A utility circuit used by the main `tallyVotes` circuit to verify that the results commitment is correct.

![ResultsCommitmentVerifier](/img/circuits/resultsCommitmentVerifier.svg)

#### QuinCheckRoot

Utility circuit that given a quin Merkle root and a list of leaves, check if the root is the correct result of inserting all the leaves into the tree in the given order.

![QuinCheckRoot](/img/circuits/quinCheckRoot.svg)

#### CalculateTotal

Utility circuit used to calculate the sum of an array of elements.

![CalculateTotal](/img/circuits/calculateTotal.svg)

#### ECDH

Utility circuit used to generate a shared key from a private key and a public key.

![ECDH](/img/circuits/ecdh.svg)

#### Poseidon

Utility circuit used to generate a Poseidon hash. In this case, it supports up to 13 inputs.

![Poseidon13](/img/circuits/poseidonHasher13.svg)

#### MessageToCommand

Utility circuit used to convert a message into a command, this involves decrypting the message.

![MessageToCommand](/img/circuits/messageToCommand.svg)

#### MessageValidator

Utility circuit used to validate a message. This performs several checks:

- `stateTreeIndex` is valid
- `voteOptionIndex` is valid
- `nonce` is valid
- the signature is valid
- the user signed up before poll end timestamp
- the user had enough voice credits

![MessageValidator](/img/circuits/messageValidator.svg)

#### PrivToPubKey

Utility circuit used to generate a public key from a private key.

![PrivToPubKey](/img/circuits/privToPubkey.svg)

#### VerifySignature

Utility circuit used to verify a EdDSA signature

![VerifySignature](/img/circuits/verifySignature.svg)

#### UnpackElement

Utility circuit used to unpack an input element.

![UnpackElement](/img/circuits/unpackElement.svg)

#### QuinSelector

Utility circuit used to select one element from an array of n elements at a given index.

![QuinSelector](/img/circuits/quinSelector.svg)

#### Splicer

Utility circuit used to insert one element in an array at position `index`.

![Splicer](/img/circuits/splicer.svg)

#### QuinBatchLeavesExists

Utility circuit used to check if a batch of leaves exists in a quinary tree.

![QuinBatchLeavesExists](/img/circuits/quinBatchLeavesExists.svg)

#### QuinGeneratePathIndices

Utility circuit used to generate the indices needed to traverse the tree until we find the leaf we are looking for.

![QuinGeneratePathIndices](/img/circuits/quinGeneratePathIndices.svg)

#### ProcessTopup

Utility circuit used to process a topup message.

![ProcessTopup](/img/circuits/processTopup.svg)

#### ProcessOne

Utility circuit used to process one message.

![ProcessOne](/img/circuits/processOne.svg)

## Compile circuits

### Prerequisites

Before building the project, make sure you have the following dependencies installed:

- [circom](https://docs.circom.io/downloads/downloads/)

### Building MACI circuits

To build the main circuits of MACI, run the following command (`-c` postfix for c++ witness gen, and `-wasm` postfix for WASM witness gen only):

```
pnpm build-test-circuits-c
pnpm build-test-circuits-wasm
```

Please note that the circuits are configured with testing purpose parameters, which means it can only handle a limited amount of messages (up to 25 messages). For more information on the parameters and how to configure them, please refer to the individual circuit documentation within this page. Also, within the [configure-circomkit](/docs/v1.2/installation#configure-circomkit) section of the `installation` page, you'll see how you can update the config file with new params.

To compile a single circuit, you can run:

```
pnpm circom:build $CIRCUIT_NAME
```

> Please note that the name should match one of the circuit names inside the `circom.json` file.

### Generating zKeys

Run from the root directory to save to the `cli/zkeys` folder:

```bash
pnpm setup:zkeys
```

Run from the circuits folder with `--outPath` to save to a custom folder:

```bash
cd circuits && pnpm gen-zkeys --outPath ./CUSTOM_FOLDER_NAME
```

The larger the trees, the more time this process may take. You may also need a
machine with a very large amount of memory.

> Note that you will have to modify the parameters inside the `./circuits/circom/circuits.json` file to match your use case. For example, if you want to support up to 3125 messages, the message tree depth parameter should be set to `5` (as $5^5 = 3125$).

#### Measure the circuit sizes

The size of a circuit is denoted by its number of constraints. The larger this
number, the more time it takes to compile it, generate its `.zkey` file, and
perform phase 2 contributions.

Run this command to measure a circuit:

```bash
pnpm exec snarkjs r1cs info CIRCUIT_NAME.circom
```

#### Download the `.ptau` file

This file should be the result of the Perpetual Powers of Tau trusted setup
contribution which [Hermez Network
selected](https://blog.hermez.io/hermez-cryptographic-setup/).

When running the `setup:zkeys` command, the `.ptau` file will be downloaded automatically.

### Generating and Validating ZK Proofs

To generate and validate ZK proofs from the artifacts produced by `circom`, you will need [`snarkjs`](https://github.com/iden3/snarkjs#groth16-1).

## Testing

To test the circuits package, please use `pnpm run test`. This will run all of the tests inside the tests folder.

To run individual tests, you can use the following commands (for all other circuits please refer to the `package.json` scripts section):

- `pnpm run test:processMessages` to run the tests for the `processMessages` circuit.
- `pnpm run test:tallyVotes` to run the tests for the `tallyVotes` circuit.

More details on testing are provided in the [testing section](/docs/v1.2/testing) of the documentation.
