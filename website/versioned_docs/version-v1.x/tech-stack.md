---
title: MACI Tech Stack
description: Overview of the MACI codebase and tech stack
sidebar_label: Tech Stack
sidebar_position: 2
---

# MACI Tech Stack

To implement an on-chain, privacy-preserving, voting protocol, the MACI codebase consists of three parts:

1. Circom circuits
2. Solidity smart contracts
3. TypeScript libraries

## Circuits

MACI has multiple zk-SNARK circuits that ensure all off-chain computation is completed correctly. The circuits enforce that message processing and vote tallying were correctly executed by the coordinator.

The MACI circuits are released through the [`@maci-circuits`](https://www.npmjs.com/package/maci-circuits) NPM package.

[Learn more about MACI circuits](/docs/circuits)

## Smart contracts

The MACI smart contracts provide the functionality to sign up voters, deploy polls, and they store on-chain data from transactions, such as the encrypted votes of a poll. They also verify proofs of the zk-SNARK circuits.

The MACI contracts are released through the [`@maci-contracts`](https://www.npmjs.com/package/maci-contracts) NPM package.

[Learn more about MACI contracts](/docs/contracts)

## TypeScript libraries

The TypeScript libraries provide a variety of functionality, such as encryption tools, utilities, and a CLI for interacting with MACI (such as vote tallying & proof-generation).

The MACI TS libraries are released through the following NPM packages:

- [`@maci-cli`](https://www.npmjs.com/package/maci-cli)
- [`@maci-common`](https://www.npmjs.com/package/maci-common)
- [`@maci-core`](https://www.npmjs.com/package/maci-core)
- [`@maci-crypto`](https://www.npmjs.com/package/maci-crypto)
- [`@maci-domainobjs`](https://www.npmjs.com/package/maci-domainobjs)
- [`@maci-integrationtests`](https://www.npmjs.com/package/maci-integrationtests)
- [`@maci-server`](https://www.npmjs.com/package/maci-server)
