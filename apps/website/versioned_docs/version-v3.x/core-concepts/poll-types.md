---
title: Poll Types
description: Which type of polls you can run on MACI
sidebar_label: Poll types
sidebar_position: 9
---

MACI allows to conduct polls in both a quadratic voting and non quadratic voting fashion. One should be aware that the only distinction between the two happens when messages are processed and votes tallied. On top of that, the Tally smart contract has been split into two different ones, with the non quadratic voting version one being slightly smaller, due to the need of one less function.

This document will explain how to use each of these options. Hardhat tasks are the currently recommended way to deploy contracts and run polls but you can also use the MACI cli.

## Quadratic Voting

MACI has always worked with quadratic voting. Users signing up to MACI are assigned a number of voice credits based on certain conditions (enforced by the [initial voice credit proxy contract](https://github.com/privacy-scaling-explorations/maci/blob/dev/packages/contracts/contracts/initialVoiceCreditProxy/ConstantInitialVoiceCreditProxy.sol)), and after each vote, the number of voice credits is reduced by the square of the weight of the vote casted. For instance, if the vote weight is 5, a user must have at least 25 voice credits to cast the vote.

To run a poll with quadratic voting, the coordinator must deploy the Poll with the mode set to quadratic voting.

### Using Hardhat tasks

In the deploy-config.json file set the `useQuadraticVoting` value to **true**.

```json
"Poll": {
    "pollDuration": 604800,
    "coordinatorPublicKey": "macipk",
    "useQuadraticVoting": true
}
```

Then run the task to create a poll:

```bash
pnpm deploy-poll:NETWORK
```

## Non Quadratic Voting

The non quadratic voting option is a new feature that has been added to MACI with the v1.2 release. It allows to conduct polls without the quadratic voting mechanism. This means that the number of voice credits is not reduced by the square of the weight of the vote casted. This option is useful for polls where the quadratic voting mechanism is not necessary, and it is also slightly cheaper for coordinators to tally votes, as there are less checks required in the Tally smart contract.

To run a poll with non quadratic voting, the coordinator must set the `useQuadraticVoting` parameter to `false` when creating the MACI instance. This will make the MACI instance use the `TallyNonQv` smart contract, which is a smaller version of the `Tally` smart contract, as it does not require the checks for the quadratic voting mechanism.

### Using Hardhat tasks

In the deploy-config.json file set the `useQuadraticVoting` value to **false**.

```json
"Poll": {
    "pollDuration": 604800,
    "coordinatorPublicKey": "macipk",
    "useQuadraticVoting": false
}
```

Then run the task to create a poll:

```bash
pnpm deploy-poll:NETWORK
```
