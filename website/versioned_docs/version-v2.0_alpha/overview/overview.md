---
title: MACI Codebase
description: High-level overview of the MACI codebase
sidebar_label: Codebase
sidebar_position: 1
---

# MACI Overview

The MACI codebase consists of three subsystems in different programming languages:

1. Circom circuits
2. Solidity smart contracts
3. TypeScript libraries

## Circuits

MACI has multiple circuits that ensure all off-chain computation is completed correctly. The circuits are used to generate zero-knowledge proofs (zk-SNARKs) that the votes were counted correctly. Specifically, they enforce that message processing and vote tallying were correctly executed by the coordinator. The proofs can then be verified through a verifier smart contract on-chain.

The circuits for these zero-knowledge proofs are written
in [Circom](https://iden3.io/circom).

The MACI circuits are released through the [`@maci-circuits`](https://www.npmjs.com/package/maci-circuits) NPM package.

[Learn more about MACI circuits](/docs/developers-references/zk-snark-circuits/introduction)

## Smart contracts

The MACI smart contracts handle the on-chain aspects - both the functionality and the storage - of the voting system. They provide the functionality to deploy polls, register voters, and accept votes. They also store and manage the on-chain data from transactions, such as the encrypted votes of a poll. Finally, they verify proofs of the zk-SNARK circuits, so that everyone can validate the voting results.

The MACI smart contracts are written in [Solidity](https://soliditylang.org/).

Contracts are released through the [`@maci-contracts`](https://www.npmjs.com/package/maci-contracts) NPM package.

[Learn more about MACI contracts](/docs/category/smart-contracts)

## TypeScript libraries

The TypeScript libraries manage the business logic between the smart contracts and the circuit code. They provide a variety of functionality, such as encryption tools, utilities, and a CLI for interacting with MACI (for actions like signing up, voting, tallying votes & generating proofs).

The MACI [TypeScript](https://www.typescriptlang.org/) libraries are released through the following NPM packages:

- [`@maci-cli`](https://www.npmjs.com/package/maci-cli)
- [`@maci-core`](https://www.npmjs.com/package/maci-core)
- [`@maci-crypto`](https://www.npmjs.com/package/maci-crypto)
- [`@maci-domainobjs`](https://www.npmjs.com/package/maci-domainobjs)
- [`@maci-integrationtests`](https://www.npmjs.com/package/maci-integrationtests)
