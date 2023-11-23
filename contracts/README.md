# `maci-contracts`

[![NPM Package][contracts-npm-badge]][contracts-npm-link]
[![Actions Status][contracts-actions-badge]][contracts-actions-link]

This submodule contains all the Ethereum contracts and tests for MACI.

For more information please refer to the [documentation for Contracts](http://privacy-scaling-explorations.github.io/maci/contracts.html).

## Compile

To compile the smart contracts, please run:

```bash
npm run compileSol $stateTreeDepth
```

The $stateTreeDepth parameter is not mandatory, however this will be set to 10 if nothing is provided. This argument is important as it will determine the size of the state tree and the number of constraints in the circuit, thus requiring a different MACI setup.

## Contracts

- **`MACI.sol`**

  - The main contract that allows users to sign-up, deploy new Polls, and merge Merkle Trees

- **`Polls.sol`**

  - All data pertaining to a poll resides here. It should be deployed via the PollFactory contract

- **`PollFactory`**

  - Resides inside `Poll.sol` and allows to deploy a new Poll contract

- **`DomainObjs.sol`**

  - Defines `structs` that represent domain objects

- **`IMACI`**

  - The interface for the MACI contract - describes callable functions

- **`Params`**

  - Contains a number of `structs` needed by the other contracts

- **`SignUpToken`**

  - An implementation of what a Signup token would look like to gatekeep access to MACI

- **`TopupCredit`**

  - A smart contract that can be used by coordinators to airdrop topup credits to voters

- **`VkRegistry`**

  - A contract holding the verifying keys for the circuits

- **`crypto/`**

  - Contracts with cryptographic functions including hash functions

- **`trees/`**

  - Contains Merkle tree contracts

- **`gatekeepers/`**

  - Abstract contract for creating signup gatekeepers and two sample implementations (FreeForAll and SignUpToken gatekeepers)

- **`initialVoiceCreditProxy/`**

  - Contains contracts implementations for retrieving voice credits assigned to voters

- **`HasherBenchmarks/`**
  - Contract with testing and gas benchmark functions only for development purposes

[contracts-npm-badge]: https://img.shields.io/npm/v/maci-contracts.svg
[contracts-npm-link]: https://www.npmjs.com/package/maci-contracts
[contracts-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/contracts-build.yml/badge.svg
[contracts-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Acontracts
