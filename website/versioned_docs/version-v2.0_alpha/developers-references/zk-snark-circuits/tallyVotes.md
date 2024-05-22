---
title: MACI Tally Votes Circuit
description: Introduction to the core zk-SNARK circuits of MACI
sidebar_label: Tally Votes Circuit
sidebar_position: 4
---

[**Repo link**](https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/core)

#### Parameters

| #   | Parameter              | Description                                              |
| --- | ---------------------- | -------------------------------------------------------- |
| 0   | State tree depth       | Allows $(5^{n})$ signups.                                |
| 1   | State leaf batch depth | Allows $(5^{n})$ users' votes to be processed per batch. |
| 2   | Vote option tree depth | Allows $(5^{n})$ vote options.                           |

![TallyVotes](/img/circuits/tallyVotes.svg)

:::info
A version working with non quadratic voting (non-qv) is also [available](https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/core/non-qv/tallyVotes.circom). This version is called `tallyVotesNonQv` and is to be used when the Poll is not using the quadratic voting feature. Note that by default MACI works with quadratic voting.
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

`numSignUps`, a value provided by the contract, is the number of users who have signed up. This is one less than the number of leaves inserted in the state tree (since the 0th state leaf is a [blank state leaf](/docs/core-concepts/state-leaf)). `batchStartIndex` is the ballot tree index at which the batch begins.

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
