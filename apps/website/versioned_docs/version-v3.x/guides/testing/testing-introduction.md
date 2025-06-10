---
title: Testing MACI
description: An introduction on how to test MACI
sidebar_label: Testing Introduction
sidebar_position: 1
---

# Testing introduction

## Unit tests

Unit tests within the project are built using [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/). Mocha is a test framework that provides the environment to write and run JavaScript tests, while Chai is an assertion library that allows us to write assertions in a more expressive and readable way.

The following submodules contain unit tests: `core`, `crypto`, `circuits`,
`contracts`, and `domainobjs`.

You can run all unit tests from the root directory of the repo by running:

```bash
pnpm run test
```

Or you can run unit tests within each submodule. for example to run the `crypto` tests:

```bash
cd packages/crypto
pnpm run test
```

You can also run individual tests within submodules, for example:

```bash
cd packages/contracts
pnpm run test:tally
```

This test command will run `Tally.test.ts`

### Contracts

First, compile the contracts.

From the main `maci/` directory, run:

```bash
cd packages/contracts && \
pnpm run compileSol
```

To run Contracts only tests, run:

```bash
pnpm run test
```

To run e2e tests for hardhat tasks for `contracts` using the in-memory hardhat network:

```bash
pnpm run test:hardhat
```

You can update the `deploy-config.json` file to change policies or other deployment settings used by the test.

You can enhance test reporting and gas cost estimation by adding the following variables to your `.env` file:

```bash
# CoinMarkerCap api key for prices (gas reporter)
COINMARKETCAP_API_KEY=
# Gas price for gas reporter
# Allows you to manually specify the gas price (e.g. 3 gwei)
GAS_REPORTER_PRICE=
```

These variables are used by `hardhat-gas-reporter` to show cost estimates for gas usage in the test reports.

If you would like to run these E2E tests against a different [supported networks](/docs/supported-networks/), you can override the network like this:

```bash
pnpm exec hardhat test --network {NETWORK} ./tests/e2e/hardhatTasks.test.ts
```

### Circuits

To test the circuits, from the main `maci/` directory, run:

```bash
cd packages/circuits && \
pnpm run test
```

Tests are run using [Mocha](https://mochajs.org/) and [`circom_tester`](https://github.com/iden3/circom_tester).

## CLI

You can test the CLI locally. First, you need to either generate `.zkey` files,
or download them. Please remember to not use these testing `.zkey` files in production.

### Download `.zkey` files or the witness generation binaries

MACI has two main zk-SNARK circuits, `MessageProcessor` and `VoteTally`.

:::info
The `MessageProcessor` and `VoteTally` circuits are also provided in a non-quadratic voting (non-QV) and in a full credits voting (full) versions. Currently these new versions have not undergone a trusted setup ceremony.
:::

Each circuit is parameterised and there should be one
`.zkey` file for each circuit and set of parameters.

Unless you wish to generate a fresh set of `.zkey` files, you should obtain
them from someone who has performed a multi-party trusted setup for said
circuits.

Note the locations of the `.zkey` files as the smart contract tasks require them as part of the JSON configuration file.

For testing purposes you can download the required artifacts using the [`download-zkeys:test`](https://github.com/privacy-scaling-explorations/maci/blob/dev/package.json#L15). The script will place all required artifacts inside the `cli/zkeys` folder.

You can run the script directly with bash or use pnpm: `pnpm run download:test-zkeys` from the monorepo root.

### Compile the circuits and generate zkeys (if decided to generate from scratch)

From the root folder, run:

**for c++ witness generator**

```bash
pnpm build:circuits-c -- --outPath ../testing/zkeys
```

**for wasm witness generator**

```bash
pnpm build:circuits-wasm -- --outPath ../testing/zkeys
```

**generate zkeys**

```bash
pnpm setup:zkeys --outPath ../testing/zkeys
```

### Check the Rapidsnark binary

Next, ensure that the `prover` binary of `rapidsnark` is in
`~/rapidsnark/build/prover`.

:::info
This step is only required if you wish to use rapidsnark, for faster proof generation. You can also use the WASM witnesses provided in the `testing/zkeys` folder.
:::

### Run CLI tests

You can find the tests in `maci/testing/ts/__tests__`.

To run the tests first start a hardhat node in the background:

```bash
cd packages/contracts
pnpm run hardhat &
cd ../testing/ts
```

Then run the tests (this will run all tests):

```bash
pnpm run test
```

To run e2e tests (quadratic voting):

```bash
pnpm run test:e2e
```

To run e2e tests with normal voting (not quadratic voting):

```bash
pnpm run test:e2e-non-qv
```

To run e2e tests with full credits voting (full):

```bash
pnpm run test:e2e-full
```

To run integration tests:

```bash
pnpm run test:integration
```
