---
title: MACI Circuits setup
description: Introduction to the core zk-SNARK circuits of MACI
sidebar_label: Building and testing
sidebar_position: 2
---

## Compile circuits

### Prerequisites

Before building the project, make sure you have the installed the dependencies as explained in the [installation](/docs/quick-start/installation) page.

### Building MACI circuits

To build the main circuits of MACI, run the following command (`-c` postfix for c++ witness gen, and `-wasm` postfix for WASM witness gen only):

```
pnpm build-test-circuits-c -- --out-path $OUT_PATH
pnpm build-test-circuits-wasm -- --out-path $OUT_PATH
```

Please note that the circuits are configured with testing purpose parameters, which means it can only handle a limited amount of messages (up to 25 messages). For more information on the parameters and how to configure them, please refer to the individual circuit documentation within this page. Also, within the [configure-circomkit](/docs/quick-start/installation#configure-circomkit) section of the `installation` page, you'll see how you can update the config file with new params.

To compile a single circuit, you can run:

```
pnpm circom:build $CIRCUIT_NAME
```

> Please note that the name should match one of the circuit names inside the `circom.json` file.

### Parameters

MACI's circuits are parameterized, and thus can be configured to support different number of users, messages (votes), and vote options. Please ensure you understand what each of these parameter means and correctly configure them when building circuits from scratch, and when deploying the smart contracts.

- **STATE_TREE_DEPTH** = how many users the system supports
- **MESSAGE_TREE_DEPTH** = how many messages (votes) the system supports
- **VOTE_OPTIONS_TREE_DEPTH** = how many vote options the system supports
- **MESSAGE_BATCH_TREE_DEPTH** = how many messages in a batch can the circuit process
- **INT_STATE_TREE_DEPTH** = how many ballots can be processed per batch when tallying the results

For instance, given a binary tree for signups, if you set `STATE_TREE_DEPTH` to 2, the system will support 4 users, as 2 \*\* 2 = 4.

For messages, we use a quinary (five leaves) merkle tree, so if you set `MESSAGE_TREE_DEPTH` to 2, the system will support 32 messages, as 5 \*\* 2 = 32.

Please refer to the individual circuit documentation for more details on the inner working of each circuit and where parameters fit.

### Generating zKeys

Run from the root directory to save to the `cli/zkeys` folder:

```bash
pnpm setup:zkeys -- --outPath ../cli/zkeys
```

Run from the circuits folder with `--outPath` to save to a custom folder:

```bash
cd packages/circuits && pnpm gen-zkeys --outPath ./CUSTOM_FOLDER_NAME
```

The larger the trees, the more time this process may take. You may also need a
machine with a very large amount of memory.

> Note that you will have to modify the parameters inside the `./circuits/circom/circuits.json` file to match your use case. For example, if you want to support up to 3125 messages, the message tree depth parameter should be set to `5` (as $5^5 = 3125$).

#### Measure the circuit sizes

The size of a circuit is denoted by its number of constraints. The larger this
number, the more time it takes to compile it, generate its `.zkey` file, and
perform phase 2 contributions.

Run this command to measure a circuit:

```bash
pnpm exec snarkjs r1cs info CIRCUIT_NAME.circom
```

#### Download the `.ptau` file

This file should be the result of the Perpetual Powers of Tau trusted setup
contribution which [Hermez Network
selected](https://blog.hermez.io/hermez-cryptographic-setup/).

When running the `setup:zkeys` command, the `.ptau` file will be downloaded automatically.

### Generating and Validating ZK Proofs

To generate and validate ZK proofs from the artifacts produced by `circom`, you will need [`snarkjs`](https://github.com/iden3/snarkjs#groth16-1).

## Testing

To test the circuits package, please use `pnpm run test`. This will run all of the tests inside the tests folder.

To run individual tests, you can use the following commands (for all other circuits please refer to the `package.json` scripts section):

- `pnpm run test:processMessages` to run the tests for the `processMessages` circuit.
- `pnpm run test:tallyVotes` to run the tests for the `tallyVotes` circuit.

More details on testing are provided in the [testing section](/docs/testing) of the documentation.
