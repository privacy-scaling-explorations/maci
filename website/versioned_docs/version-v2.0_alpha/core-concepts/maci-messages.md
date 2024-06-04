---
title: Commands and Messages
description: A short introduction of MACI's commands and messages
sidebar_label: Commands and Messages
sidebar_position: 3
---

## Command

A command represents an action that a user may take, such as casting a vote in a poll or changing their public key if bribed. It is made up of the following parameters:

| Symbol       | Name                    | Size | Description                                                                                         |
| ------------ | ----------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| $cm_i$       | State index             | 50   | State leaf index where the signing key is located                                                   |
| $cm_{p_{x}}$ | Public key x-coordinate | 253  | If no change is necessary this parameter should reflect the current public key's x-coordinate       |
| $cm_{p_{y}}$ | Public key y-coordinate | 253  | If no change is necessary this parameter should reflect the current public key's y-coordinate       |
| $cm_{i_{v}}$ | Vote option index       | 50   | Option state leaf index of preference to assign the vote for                                        |
| $cm_w$       | Voting weight           | 50   | Voice credit balance allocation, this is an arbitrary value dependent on a user's available credits |
| $cm_n$       | Nonce                   | 50   | State leaf's index of actions committed plus one                                                    |
| $cm_{id}$    | Poll id                 | 50   | The poll's identifier to cast in regard to                                                          |
| $cm_s$       | Salt                    | 253  | An entropy value to inhibit brute force attacks                                                     |

## Message

A message is an encrypted command using the shared key $k_s$ between the voter and the coordinator. The plaintext $t$ is computed as such:

$t = [p, cm_{p_{x}}, cm_{p_{y}}, cm_s, R8[0], R8[1], S]$

While the message can be computed with the formula below:

$M$ = ${poseidonEncrypt}(k_s[0], k_s[1], cm_n, 7, t)$

### Decrypting a message

To decrypt a message using $k_s$ we have the following:

$[p, R8[0], R8[1], cm_s]$ = ${poseidonDecrypt}(M, k_s[0], k_s[1], cm_n, 7)$

To unpack $p$ to its original five parameters, it must be separated into 50 bit values from the parent 250 bit value. To extract 50 bits at byte $n$, we:

1. initialise 50 bits
2. shift left by $n$ bits
3. bitwise AND with $p$
4. shift right by $n$ bits
