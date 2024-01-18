---
title: Introduction to MACI
description: High-level introduction to Minimum Anti-Collusion Infrastructure (MACI)
sidebar_label: Introduction
sidebar_position: 1
---

# Welcome to MACI

![MACI card](/img/maci-card.png)

## Introduction

**Minimal Anti-Collusion Infrastructure (MACI)** is an open-source public good that serves as infrastructure for private on-chain voting.

MACI is an application that allows users to have an on-chain voting process with greatly increased collusion resistance. A common problem among today’s on-chain voting (or public good funding) processes is how easy it is to bribe voters into voting for a particular option. Since all transactions on the blockchain are public by default, without MACI, voters can easily prove to the briber which option they voted for and therefore receive the bribe rewards.

MACI counters this problem by using encryption and zero-knowledge proofs (zk-SNARKs) to essentially hide how each person voted while still publicly revealing the final vote result. User’s cannot prove which option they voted for, and therefore bribers cannot reliably trust that a user voted for their preferred option. For example, a voter can tell a briber that they are voting for option A, but in reality they voted for option B. There is no reliable way to prove which option the voter actually voted for, so the briber has less incentive to pay voters to vote their way.

Applications like [clr.fund](https://clr.fund/) build atop MACI to increase
user privacy and discourage collusion or bribery for public goods funding.

## Features

MACI offers the following guarantees:

- **Collusion resistance**: no-one except a trusted coordinator should be
  certain of the validity of a vote, reducing the effectiveness of bribery.
- **Receipt-freeness**: no voter should be able to prove (besides to the coordinator) which way they voted.
- **Privacy**: no-one except a trusted coordinator should be able to decrypt a
  vote.
- **Uncensorability**: no-one — not even the trusted coordinator — should be
  able to censor a vote.
- **Unforgeability**: only the owner of a user's private key may cast a vote
  tied to its corresponding public key.
- **Non-repudiation**: no-one may modify or delete a vote after it is cast,
  although a user may cast another vote to nullify it.
- **Correct execution**: no-one — not even the trusted coordinator — should be
  able to produce a false tally of votes.

Under the hood, MACI uses Ethereum smart contracts and zero-knowledge proofs.
It inherits security and uncensorability from the underlying Ethereum
blockchain, ensures unforgeability via asymmetric encryption, and achieves
collusion resistance, privacy, and correct execution via zk-SNARK proofs.

Although MACI can provide collusion resistance only if the coordinator is
honest, a dishonest coordinator can neither censor nor tamper with its
execution.

Note that MACI presumes an identity system where each legitimate member
controls a unique Ethereum private key.

## Background

MACI was originally proposed by Vitalik Buterin in [this ethresear.ch
post](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413). For a general overview, the history and the importance of MACI, see [Release Announcement: MACI 1.0](/blog/maci-1-0-release) by Wei Jie, one of the creators. He also created a helpful [overview of MACI video](https://www.youtube.com/watch?v=sKuNj_IQVYI). Kyle Charbonnet wrote a great [Technical Introduction to MACI 1.0](/blog/maci-1-0-technical-introduction) that provides a walkthrough on how MACI operates.

## Credits

MACI is a public good infrastructure that is supported by the [Ethereum Foundation](https://ethereum.foundation/) within [Privacy &amp; Scaling Explorations (PSE)](https://pse.dev/). It's also continuously improved by our open source community! Many people have contributed to MACI, but below are some notable contributors.

**[MACI v1.0](/blog/maci-1-0-release) was originally developed by:**

- [Barry WhiteHat](https://github.com/barryWhiteHat)
- [Cory Dickson](https://github.com/corydickson)
- [Chih-Cheng Liang](https://twitter.com/ChihChengLiang)
- [Han Jian](https://han0110.github.io/)
- [Kendrick Tan](https://kndrck.co/)
- [Kirill Goncharov](https://github.com/xuhcc)
- [Kobi Gurkan](http://kobi.one/)
- [Koh Wei Jie](https://kohweijie.com)
- [Samuel Gosling](https://twitter.com/xGozzy)

**[MACI v1.1.1](/blog/maci-v1-1-1-release) was primarily developed by:**

- [ctrlc03](https://github.com/ctrlc03)
- [chaosma](https://github.com/chaosma)
- [baumstern](https://github.com/baumstern)
- [daodesigner](https://github.com/daodesigner)
- [0xjei](https://github.com/0xjei)

**Currently, MACI is maintained and continuously improved by a core development team:**

- [ctrlc03](https://github.com/ctrlc03)
- [samajammin](https://github.com/samajammin)
- [0xmad](https://github.com/0xmad)
- [kittybest](https://github.com/kittybest)
- [crisgarner](https://github.com/crisgarner)

Our core team continues to work on improving the protocol and its documentation with help from our open source community.

:::info
If you are using one of the previous versions of MACI, see the [MACI v0.x](/docs/v0.x/introduction) documentation.
:::
