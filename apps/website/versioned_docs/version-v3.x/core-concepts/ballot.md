---
title: Ballot
description: A short introduction of the main primitives used by MACI
sidebar_label: Ballot
sidebar_position: 4
---

A Ballot represents a particular user's votes in a poll, as well as their next valid nonce. It is akin to a voting slip, which belongs to only one voter and contains a list of their choices.

| Symbol    | Name                       | Comments                                                                   |
| --------- | -------------------------- | -------------------------------------------------------------------------- |
| $blt_{v}$ | An array of vote weights   | $blt_{v[i]}$ refers to the vote weights assigned to vote option $i$        |
| $blt_n$   | The current nonce          | Starts from 0 and increments, so the first valid command must have nonce 1 |
| $blt_d$   | The vote option tree depth | The depth of the vote option tree                                          |

The hash $blt$ is computed as such:

1. Compute the Merkle root of $blt_v$, arity 5, of a tree of depth $blt_d$; let this value be $blt_r$
2. Compute $poseidon_2([blt_n, blt_r])$
