# `maci-contracts`

This submodule contains all the Ethereum contracts and tests for MACI. 

For more information please refer to the [documentation for Contracts](http://privacy-scaling-explorations.github.io/maci/contracts.html).

## Contracts

* **`MACI.sol`**
    - The main contract that allows users to sign-up, deploy new Polls, and merge Merkle Trees

* **`Polls.sol`**
    - All data pertaining to a poll resides here. It should be deployed via the PollFactory contract

* **`PollFactory`**
    - Resides inside `Poll.sol` and allows to deploy a new Poll contract

* **`DomainObjs.sol`**
    - Defines `structs` that represent domain objects

* **`IMACI`**
    - The interface for the MACI contract - describes callable functions

* **`Params`**
    - Contains a number of `structs` needed by the other contracts

* **`SignUpToken`**
    - An implementation of what a Signup token would look like to gatekeep access to MACI

* **`TopupCredit`**
    - A smart contract that can be used by coordinators to airdrop topup credits to voters

* **`VkRegistry`**
    - A contract holding the verifying keys for the circuits

* **`crypto/`**
    - Contracts with cryptographic functions including hash functions

* **`trees/`**
    - Contains Merkle tree contracts

* **`gatekeepers/`**
    - Abstract contract for creating signup gatekeepers and two sample implementations (FreeForAll and SignUpToken gatekeepers)

* **`initialVoiceCreditProxy/`**
    - Contains contracts implementations for retrieving voice credits assigned to voters

* **`HasherBenchmarks/`**
    - Contract with testing and gas benchmark functions only for development purposes
