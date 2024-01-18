---
title: MACI Overview
description: High-level overview of the MACI codebase
sidebar_label: Overview
sidebar_position: 2
---

# MACI Overview

The MACI codebase consists of three subsystems in different programming languages:

1. Circom circuits
2. Solidity smart contracts
3. TypeScript libraries

## Circuits

MACI has multiple zk-SNARK circuits that ensure all off-chain computation is completed correctly. The circuits enforce that message processing and vote tallying were correctly executed by the coordinator.

The circuits for these zero-knowledge proofs are written
in [Circom](https://iden3.io/circom).

The MACI circuits are released through the [`@maci-circuits`](https://www.npmjs.com/package/maci-circuits) NPM package.

[Learn more about MACI circuits](/docs/circuits)

## Smart contracts

The MACI smart contracts handle the management and on-chain voting aspects of the system. They provide the functionality to sign up voters, deploy polls, and they store on-chain data from transactions, such as the encrypted votes of a poll. They also verify proofs of the zk-SNARK circuits.

The MACI smart contracts are written in [Solidity](https://soliditylang.org/).

Contracts are released through the [`@maci-contracts`](https://www.npmjs.com/package/maci-contracts) NPM package.

[Learn more about MACI contracts](/docs/contracts)

## TypeScript libraries

The TypeScript libraries manage the business logic between the smart contracts and the circuit code. They provide a variety of functionality, such as encryption tools, utilities, and a CLI for interacting with MACI (such as vote tallying & proof-generation).

The MACI [TypeScript](https://www.typescriptlang.org/) libraries are released through the following NPM packages:

- [`@maci-cli`](https://www.npmjs.com/package/maci-cli)
- [`@maci-core`](https://www.npmjs.com/package/maci-core)
- [`@maci-crypto`](https://www.npmjs.com/package/maci-crypto)
- [`@maci-domainobjs`](https://www.npmjs.com/package/maci-domainobjs)
- [`@maci-integrationtests`](https://www.npmjs.com/package/maci-integrationtests)
