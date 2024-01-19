---
title: MACI Testing in Detail
description: How MACI tests work in detail
sidebar_label: Testing in detail
sidebar_position: 10
---

# Testing in detail

This doc expands on our [introduction to testing](/docs/testing) doc and explains how MACI tests work in greater detail. This information should be used by MACI's maintainers as well as contributors.

## Automated Tests

### CLI Tests

MACI's CLI provides a series of commands that can be used by both the coordinator and voters, to interact with MACI, from deploying smart contracts to submitting a vote.

Currently, there are a number of test cases that are available inside the cli tests folder. The tests are split into two categories:

- e2e tests that include the entire MACI stack, from deploying the contracts to submitting a vote and tallying all results.
- e2e tests as above, but with the subsidy feature enabled.

The goal of these tests is to ensure that the MACI stack works as expected, and that the coordinator and voters can interact with the system as expected. They currently do not attempt to verify whether the tally results are expected, or that all votes were accounted for. On the other hand, they test different scenarios, mixing different numbers of voters and messages.

### Integration Tests

Integration tests follow a similar fashion of the CLI tests, though they also ensure that the tally results are as expected.

Currently, tests are defined using a JSON file, here is one example:

```json
{
  "name": "Happy path",
  "description": "Full tree, 4 batches, no bribers",
  "numVotesPerUser": 1,
  "numUsers": 15,
  "expectedTally": [15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "expectedSpentVoiceCredits": [15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "expectedTotalSpentVoiceCredits": 15
}
```

This test will generate 15 signups (as expressed in `numUsers`), and submit one vote (`numVotesPerUser`) for each of the users. As we did not provide any vote detail, it will use the default: `weight = 1`, `option = 0` for all voters. This will result of course in a tally result of 15 for option 0, and 0 for all other options.

Finally, the whole process of merging the state and message trees is performed, proofs are generated and the tally result is verified against the expected result.

#### How to implement a new test case

To add a new test cases, it is quite simple. You can amend the `integrationTests/ts/__tests__/data/suites.json` file and add your test declaration in there.

```json
{
  "name": "Subsidy test",
  "description": "has subsidy result",
  "numUsers": 4,
  "numVotesPerUser": 1,
  "votes": {
    "0": {
      "0": { "voteOptionIndex": 0, "voteWeight": 1, "valid": true }
    },
    "1": {
      "0": { "voteOptionIndex": 0, "voteWeight": 1, "valid": true }
    },
    "2": {
      "0": { "voteOptionIndex": 0, "voteWeight": 1, "valid": true }
    },
    "3": {
      "0": { "voteOptionIndex": 0, "voteWeight": 1, "valid": true }
    }
  },
  "expectedTally": [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "expectedSpentVoiceCredits": [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "expectedTotalSpentVoiceCredits": 4,
  "subsidy": {
    "enabled": true,
    "expectedSubsidy": [117636, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }
}
```

Let's look at the fields in detail:

- `name`: the name of the test case
- `description`: a description of the test case
- `numUsers`: the number of users to generate
- `numVotesPerUser`: the number of votes to generate for each user
- `votes`: the votes to generate. This is an object where the key is the user index, and the value is another object where the key is the message index, and the value is the vote details. If you do not provide any vote details, the default will be used: `weight = 1`, `option = 0` for all voters.
- `expectedTally`: the expected tally result for each vote option (in order)
- `expectedSpentVoiceCredits`: the expected spent voice credits for each vote option (in order)
- `expectedTotalSpentVoiceCredits`: the expected total spent voice credits
- `subsidy`: an object that contains the subsidy details. If you do not provide any subsidy details, the default will be used: `enabled = false`, `expectedSubsidy = []`. If you do provide subsidy details, you must provide both fields.

As an example, let's try to implement a test given the following criterias:

1. We want 10 users to signup
2. We want each user to publish a different vote
3. We want to verify that the tally result is as expected
4. We will not use the subsidy feature

```json
{
  "name": "10 Users test",
  "description": "Should signup 10 users, submit 10 votes and tally the results",
  "numUsers": 10,
  "numVotesPerUser": 1,
  "votes": {
    "0": {
      "0": { "voteOptionIndex": 0, "voteWeight": 5 }
    },
    "1": {
      "0": { "voteOptionIndex": 0, "voteWeight": 9 }
    },
    "2": {
      "0": { "voteOptionIndex": 5, "voteWeight": 3 }
    },
    "3": {
      "0": { "voteOptionIndex": 3, "voteWeight": 2 }
    },
    "4": {
      "0": { "voteOptionIndex": 0, "voteWeight": 1 }
    },
    "5": {
      "0": { "voteOptionIndex": 9, "voteWeight": 1 }
    },
    "6": {
      "0": { "voteOptionIndex": 4, "voteWeight": 7 }
    },
    "7": {
      "0": { "voteOptionIndex": 7, "voteWeight": 5 }
    },
    "8": {
      "0": { "voteOptionIndex": 3, "voteWeight": 10 }
    },
    "9": {
      "0": { "voteOptionIndex": 8, "voteWeight": 2 }
    }
  },
  "expectedTally": [15, 0, 0, 12, 7, 3, 0, 5, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  "expectedSpentVoiceCredits": [107, 0, 0, 104, 49, 9, 0, 25, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "expectedTotalSpentVoiceCredits": 299
}
```

**Why expectedTally as above**

[(5 + 9 + 1), 0, 0, (2 + 10), 7, 3, 0, 5, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0] -> [15, 0, 0, 12, 7, 3, 0, 5, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0]

**Why 299 voice credits spent**

- 5 ** 2 + 9 ** 2 + 3 ** 2 + 2 ** 2 + 1 ** 2 + 1 ** 1 + 7 ** 2 + 5 ** 2 + 10 ** 2 + 2 ** 2 = 25 + 81 + 9 + 4 + 1 + 1 + 49 + 25 + 100 + 4 = 299

**Why expectedSpentVoiceCredits as above**

[(25 + 81 + 1), 0, 0, (4 + 100), 49, 0, 25, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] -> [107, 0, 0, 104, 49, 0, 25, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

#### MACI keys integration tests

Another test file which is found inside the integration tests folder is the `maciKeys.test.ts` file. This file contains a number of tests that are used to verify that the MACI keys work as expected. These tests are written in TypeScript and use the `mocha` and `chai` frameworks.

They are testing that between the `contracts`, `domainobjs` and `crypto` packages, the MACI keys are working correctly, and are serialized/deserialized as expected. This is particularly important to test due to different data formats for keys, especially when parsed from the smart contract events.

### Contract tests

Within the contracts folder, there are a number of tests that are used to verify that the contracts work as expected. These tests are written in TypeScript and use the `hardhat` framework.

These tests interact with all other packages, such as crypto, domainobjs and core, where mock data comes from. Their main goal is to ensure that the smart contracts have the correct parameters when deployed, privileged functions cannot be called by non-privileged users, and that the contract state is as expected after a series of operations.

### Circuits tests

Within the circuits folder, there are a number of tests that are used to verify that the circuits work as expected. These tests are written in TypeScript and use the `circom_tester` (which runs on top of `mocha` and `chai`).

These tests often use mock data from the `core` package. For instance, when testing the `processMessages` circuit, we are required to generate the parameters from the `core` packing, using the `Poll:processMessages` function. The same applies to vote tallying, where we need the `Poll:tally` function to be run first with mock users and vote messages.

All of the tests run using test parameters, usually `10, 2, 1, 2`, aside from the tests inside: [`ceremonyParam`](https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/ts/__tests__/CeremonyParams.test.ts) which use the parameters of the latest MACI ceremony. More details on the trusted setup can be found [here](/docs/trusted-setup).

### Core

The core package contains a number of tests that are used to verify that the core functions work as expected. These tests are written in TypeScript and use the `mocha` and `chai` frameworks.

These tests interact with the crypto and dombinobjs packages, where mock data comes from. Their main goal is to ensure that the core functions work as expected, and that the state is as expected after a series of operations.

Currently, there is a blend of e2e and unit tests, where e2e tests are used to verify that the entire MACI local processing works as expcted (users signup, publish votes, messages are processed and finally these votes are tallied). Unit tests on the other hand are used to verify that the core functions work as expected, such as `processMessage` and `tallyVotes`. You will find them in separate files, with e2e being [here](https://github.com/privacy-scaling-explorations/maci/blob/dev/core/ts/__tests__/e2e.test.ts) and unit tests in the other files.

### Domainobjs/Crypto tests

These tests are used to verify that MACI's primitives such as private keys work as expected. They are written in TypeScript and use the `mocha` and `chai` frameworks.

## "Manual" Testing

To ensure that the MACI stack works as expected, without having to run the entire test suite (or even just the e2e tests), there is a [bash script](https://github.com/privacy-scaling-explorations/maci/blob/dev/cli/testScript.sh) inside the cli folder which can be used.

This script contains a number of actions which touch all of the parts of MACI, and resemble exactly what other e2e tests do.

Looking at this in more details we do the following:

1. Deploy a `VkRegistry` contract
2. Set the verification keys on this smart contract
3. Deploy a `MACI` contract (and associated utility contracts)
4. Deploy a Poll from the MACI contract.
5. Signup 1 user
6. Publish 2 messages
7. Travel in time (local blockchain node) to arrive at the end of the poll
8. Merge the signups tree
9. Merge the messages tree
10. Generate proofs for the message processing and vote tallying
11. Update the on chain state
12. Verify that proofs and tally are correct

The above is the minimum required to ensure that the stack works as expected, as it encompasses actions from both voters and the coordinator.
