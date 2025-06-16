---
title: MACI Codebase
description: High-level overview of the MACI codebase
sidebar_label: Technical References
sidebar_position: 1
---

# MACI Overview

The MACI codebase consists of three subsystems in different programming languages:

1. Solidity smart contracts
2. TypeScript libraries
3. Circom circuits

## Smart contracts

The MACI smart contracts handle the on-chain aspects - both the functionality and the storage - of the voting system. They provide the functionality to deploy polls, register voters, and accept votes. They also store and manage the on-chain data from transactions, such as the encrypted votes of a poll. Finally, they verify proofs of the zk-SNARK circuits, so that everyone can validate the voting results.

The MACI smart contracts are written in [Solidity](https://soliditylang.org/).

Contracts are released through the [`@maci-protocol/contracts`](https://www.npmjs.com/package/@maci-protocol/contracts) NPM package.

[Learn more about MACI contracts](/docs/technical-references/smart-contracts/)

## TypeScript libraries

The TypeScript libraries manage the business logic between the smart contracts and the circuit code. They provide a variety of functionality, such as encryption tools, utilities, and a CLI for interacting with MACI (for actions like signing up, voting, tallying votes & generating proofs).

The MACI [TypeScript](https://www.typescriptlang.org/) libraries are released through the following NPM packages:

- [`@maci-protocol/cli`](https://www.npmjs.com/package/@maci-protocol/cli)
- [`@maci-protocol/core`](https://www.npmjs.com/package/@maci-protocol/core)
- [`@maci-protocol/crypto`](https://www.npmjs.com/package/@maci-protocol/crypto)
- [`@maci-protocol/domainobjs`](https://www.npmjs.com/package/@maci-protocol/domainobjs)
- [`@maci-protocol/integrationtests`](https://www.npmjs.com/package/@maci-protocol/integrationtests)
- [`@maci-protocol/sdk`](https://www.npmjs.com/package/@maci-protocol/sdk)

## Circuits

MACI has multiple circuits that ensure all off-chain computation is completed correctly. The circuits are used to generate zero-knowledge proofs (zk-SNARKs) that the votes were counted correctly. Specifically, they enforce that message processing and vote tallying were correctly executed by the coordinator. The proofs can then be verified through a verifier smart contract on-chain.

The circuits for these zero-knowledge proofs are written
in [Circom](https://iden3.io/circom).

The MACI circuits are released through the [`@maci-protocol/circuits`](https://www.npmjs.com/package/@maci-protocol/circuits) NPM package.

[Learn more about MACI circuits](/docs/technical-references/zk-snark-circuits/)
