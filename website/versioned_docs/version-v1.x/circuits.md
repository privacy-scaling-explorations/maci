---
title: MACI Circuits
description: Introduction to the core zk-SNARK circuits of MACI
sidebar_label: Circuits
sidebar_position: 7
---

# Circuits

MACI has three zk-SNARK circuits:

1. `ProcessMessages.circom`, which takes a batch of messages, and updates the
   state and ballot trees according to the contents of said messages.
2. `TallyVotes.circom`, which counts votes from users' ballots, batch by batch.
3. `Subsidy.circom`, which implements [pairwise subsidy](https://hackmd.io/@chaosma/H1_9xmT2K)

Each circuit is parameterised and it is important to set the right parameters
to your use case. For example, if you want to support up to 3125 messages, the message tree depth parameter should be set to `5` (as $5^5 = 3125$).

Next, navigate to the `cli/` directory and edit `zkeys.config.yml`.

This config file defines the parameters required for MACI's circuits.

## How the circuits work

![TallyVotes](/img/circuits/tallyVotes.png)

![TallyVotesInputHasher](/img/circuits/tallyVotesInputHasher.png)

![ResultsCommitmentVerifier](/img/circuits/resultsCommitmentVerifier.png)

![QuinCheckRoot](/img/circuits/quinCheckRoot.png)

![CalculateTotal](/img/circuits/calculateTotal.png)

![ECDH](/img/circuits/ecdh.png)

![Poseidon13](/img/circuits/poseidon13.png)


### Message processing

| #   | Parameter                | Description                                          |
| --- | ------------------------ | ---------------------------------------------------- |
| 0   | State tree depth         | Should be set to 10. Allows 9,765,625 signups.       |
| 1   | Message tree depth       | Allows $(5^{n})$ votes or key-change messages.       |
| 2   | Message batch tree depth | Allows $(5^{n})$ messages to be processed per batch. |
| 3   | Vote option tree depth   | Allows $(5^{n})$ vote options.                       |

### Vote tallying

| #   | Parameter              | Description                                              |
| --- | ---------------------- | -------------------------------------------------------- |
| 0   | State tree depth       | Should be set to 10. Allows 9,765,625 signups.           |
| 1   | State leaf batch depth | Allows $(5^{n})$ users' votes to be processed per batch. |
| 2   | Vote option tree depth | Allows $(5^{n})$ vote options.                           |

### Subsisdy

| #   | Parameter              | Description                                              |
| --- | ---------------------- | -------------------------------------------------------- |
| 0   | State tree depth       | Should be set to 10. Allows 9,765,625 signups.           |
| 1   | State leaf batch depth | Allows $(5^{n})$ users' votes to be processed per batch. |
| 2   | Vote option tree depth | Allows $(5^{n})$ vote options.                           |

## Compile circuits

### Prerequisites

Before building the project, make sure you have the following dependencies installed:

- [circom](https://docs.circom.io/downloads/downloads/)

### Building MACI circuits

To build the two main circuits of MACI, run the following commands:

```
circom --r1cs --sym --wasm --output ./build circom/test/processMessages_test.circom
circom --r1cs --sym --wasm --output ./build circom/test/tallyVotes_test.circom
```

Please note that the circuit is configured with testing purpose parameters, which means it can only handle a limited amount of messages (up to 25 messages). For more information on the parameters and how to configure them, refer to [this page](https://maci.pse.dev/docs/circuits.html#compile-circuits).

### Generating zKeys

Run:

```bash
npx zkey-manager compile -c ./zkeys.config.yml
```

The larger the trees, the more time this process may take. You may also need a
machine with a very large amount of memory.

#### Measure the circuit sizes

The size of a circuit is denoted by its number of constraints. The larger this
number, the more time it takes to compile it, generate its `.zkey` file, and
perform phase 2 contributions.

Run this command to measure a circuit:

```bash
npx snarkjs r1cs info CIRCUIT_NAME.circom
```

#### Download the `.ptau` file

This file should be the result of the Perpetual Powers of Tau trusted setup
contribution which [Hermez Network
selected](https://blog.hermez.io/hermez-cryptographic-setup/).

Run:

```bash
npx zkey-manager downloadPtau -c ./zkeys.config.yml
```

`zkey-manager` will select the smallest `.ptau` file that fits the largest
circuit specified in `zkeys.config.yml`.

### Generating and Validating ZK Proofs

To generate and validate ZK proofs from the artifacts produced by `circom`, you will need [`snarkjs`](https://github.com/iden3/snarkjs#groth16-1).

## Testing

To test the circuits package, please use `npm run test`. This will run all of the tests inside the tests folder.

To run individual tests, you can use the following commands (for all other circuits please refer to the `package.json` scripts section):

- `npm run test-processMessages` to run the tests for the `processMessages` circuit.
- `npm run test-tallyVotes` to run the tests for the `tallyVotes` circuit.
