---
title: MACI Poll Types
description: Which type of polls you can run on MACI
sidebar_label: MACI poll types
sidebar_position: 21
---

# MACI Poll Types

MACI allows to conduct polls in both a quadratic voting and non quadratic voting fashion. One should be aware that the only distinction between the two happens when messages are processed and votes tallied. On top of that, the Tally smart contract has been split into two different ones, with the non quadratic voting version one being slightly smaller, due to the need of one less function.

This document will explain how to use each of these options.

## Quadratic Voting

MACI has always worked with quadratic voting. Users signing up to MACI are assigned a number of voice credits based on certain conditions (enforced by the [initial voice credit proxy contract](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol)), and after each vote, the number of voice credits is reduced by the square of the weight of the vote casted. For instance, if the vote weight is 5, a user must have at least 25 voice credits to cast the vote.

To run a poll with quadratic voting, the coordinator must set the `useQuadraticVoting` parameter to `true` when creating the MACI instance. This will make the MACI instance use the `Tally` smart contract, which is the one that has been used since the beginning of MACI.

Using MACI's cli, one can create a MACI instance with quadratic voting by running the following command:

```bash
maci-cli create -uq true $OTHER_PARAMETERS
```

Then, when generating the zkSNARK proofs, the coordinator should pass the following to the `genProofs` command:

```bash
maci-cli genProofs -uq true $OTHER_PARAMETERS
```

For users, when verifying the tally results, please ensure that the tally file contains the entry:

```json
{
  "isQuadratic": true
}
```

If verifying without a tally file, but by passing a tally data object, please ensure that the object has the same entry set to true.

## Non Quadratic Voting

The non quadratic voting option is a new feature that has been added to MACI with the v1.2 release. It allows to conduct polls without the quadratic voting mechanism. This means that the number of voice credits is not reduced by the square of the weight of the vote casted. This option is useful for polls where the quadratic voting mechanism is not necessary, and it is also slightly cheaper for coordinators to tally votes, as there are less checks required in the Tally smart contract.

To run a poll with non quadratic voting, the coordinator must set the `useQuadraticVoting` parameter to `false` when creating the Poll instance. This will make the Poll instance use the `NonQv` logic.

Using MACI's cli, one can create a MACI instance with non quadratic voting by running the following command:

```bash
maci-cli create -uq false $OTHER_PARAMETERS
```

Then, when generating the zkSNARK proofs, the coordinator should pass the following to the `genProofs` command:

```bash
maci-cli genProofs -uq false $OTHER_PARAMETERS
```

For users, when verifying the tally results, please ensure that the tally file contains the entry:

```json
{
  "isQuadratic": false
}
```

If verifying without a tally file, but by passing a tally data object, please ensure that the object has the same entry set to false.
