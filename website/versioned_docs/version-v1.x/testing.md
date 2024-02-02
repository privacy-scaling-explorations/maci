---
title: Testing MACI
description: An introduction on how to test MACI
sidebar_label: Testing
sidebar_position: 9
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
cd crypto
pnpm run test
```

You can also run individual tests within submodules, for example:

```bash
cd contracts
pnpm run test:accQueue
```

This test command will run `AccQueue.test.ts`

### Contracts

First, compile the contracts.

From the main `maci/` directory, run:

```bash
cd contracts && \
pnpm run compileSol
```

To run Contracts only tests, run:

```bash
pnpm run test
```

### Circuits

To test the circuits, from the main `maci/` directory, run:

```bash
cd circuits && \
pnpm run test
```

Tests are run using [Mocha](https://mochajs.org/) and [`circom_tester`](https://github.com/iden3/circom_tester).

## CLI

You can test the CLI locally. First, you need to either generate `.zkey` files,
or download them. Please remember to not use these testing `.zkey` files in production.

### Download `.zkey` files or the witness generation binaries

MACI has two main zk-SNARK circuits, `processMessages` and `tallyVotes` (`subsidyPerBatch` is optional).

:::info
The `processMessages` and `tallyVotes` circuits are also provided in a non-quadratic voting (non-QV) version. Currently these new versions have not undergone a trusted setup ceremony.
:::

Each circuit is parameterised and there should be one
`.zkey` file for each circuit and set of parameters.

Unless you wish to generate a fresh set of `.zkey` files, you should obtain
them from someone who has performed a multi-party trusted setup for said
circuits.

Note the locations of the `.zkey` files as the CLI requires them as
command-line flags.

For testing purposes you can download the required artifacts using the [`download_zkeys`](https://github.com/privacy-scaling-explorations/maci/blob/dev/integrationTests/scripts/download_zkeys.sh) script inside the `integrationTests/scripts` folder. The script will place all required artifacts inside the `cli/zkeys` folder.
You can run the script directly with bash or use pnpm: `pnpm run download:test-zkeys` from the monorepo root.

### Compile the circuits and generate zkeys (if decided to generate from scratch)

From the root folder, run:

**for c++ witness generator**

```bash
pnpm build:circuits-c
```

**for wasm witness generator**

```bash
pnpm build:circuits-wasm
```

You should see the following files in `maci/cli/`:

```bash
zkeys/
zkeys/TallyVotes_10-1-2_test/
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.sym
zkeys/TallyVotes_10-1-2_test/groth16_vkey.json
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.r1cs
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/calcwit.cpp
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/circom.hpp
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/fr.o
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test.o
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/main.o
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/calcwit.o
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/fr.hpp
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/Makefile
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/fr.asm
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test.dat
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/fr_asm.o
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/main.cpp
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test.cpp
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/fr.cpp
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/calcwit.hpp
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/generate_witness.js
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/witness_calculator.js
zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm
zkeys/ProcessMessagesNonQv_10-2-1-2_test/
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test.0.zkey
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/calcwit.cpp
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/circom.hpp
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/fr.o
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/ProcessMessagesNonQv_10-2-1-2_test.dat
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/ProcessMessagesNonQv_10-2-1-2_test
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/ProcessMessagesNonQv_10-2-1-2_test.o
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/main.o
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/calcwit.o
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/fr.hpp
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/Makefile
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/fr.asm
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/fr_asm.o
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/main.cpp
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/fr.cpp
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/calcwit.hpp
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/ProcessMessagesNonQv_10-2-1-2_test.cpp
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test.sym
zkeys/ProcessMessagesNonQv_10-2-1-2_test/groth16_vkey.json
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test.r1cs
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_js/
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_js/generate_witness.js
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_js/witness_calculator.js
zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_js/ProcessMessagesNonQv_10-2-1-2_test.wasm
zkeys/processMessages_6-8-2-3/
zkeys/powersOfTau28_hez_final_19.ptau
zkeys/TallyVotesNonQv_10-1-2_test/
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/calcwit.cpp
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/circom.hpp
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/fr.o
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/main.o
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/calcwit.o
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/fr.hpp
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/Makefile
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/fr.asm
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test.o
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/fr_asm.o
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test.cpp
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/main.cpp
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test.dat
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/fr.cpp
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/calcwit.hpp
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_js/
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_js/TallyVotesNonQv_10-1-2_test.wasm
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_js/generate_witness.js
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_js/witness_calculator.js
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.sym
zkeys/TallyVotesNonQv_10-1-2_test/groth16_vkey.json
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.r1cs
zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey
zkeys/ProcessMessages_10-2-1-2_test/
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/generate_witness.js
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/witness_calculator.js
zkeys/ProcessMessages_10-2-1-2_test/groth16_vkey.json
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.r1cs
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.sym
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/calcwit.cpp
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/circom.hpp
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/fr.o
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test.o
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test.cpp
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/main.o
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/calcwit.o
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/fr.hpp
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/Makefile
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/fr.asm
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/fr_asm.o
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/main.cpp
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test.dat
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/fr.cpp
zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/calcwit.hpp
zkeys/powersOfTau28_hez_final_17.ptau
zkeys/SubsidyPerBatch_10-1-2_test/
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test.sym
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test.0.zkey
zkeys/SubsidyPerBatch_10-1-2_test/groth16_vkey.json
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test.r1cs
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_js/
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_js/generate_witness.js
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_js/witness_calculator.js
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_js/SubsidyPerBatch_10-1-2_test.wasm
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/calcwit.cpp
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/circom.hpp
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/fr.o
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/SubsidyPerBatch_10-1-2_test.dat
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/main.o
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/SubsidyPerBatch_10-1-2_test.cpp
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/calcwit.o
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/fr.hpp
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/Makefile
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/fr.asm
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/fr_asm.o
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/main.cpp
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/fr.cpp
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/SubsidyPerBatch_10-1-2_test.o
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/calcwit.hpp
zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/SubsidyPerBatch_10-1-2_test
```

**generate zkeys**

```bash
pnpm setup:zkeys
```

### Check the Rapidsnark binary

Next, ensure that the `prover` binary of `rapidsnark` is in
`~/rapidsnark/build/prover`.

:::info
This step is only required if you wish to use rapidsnark, for faster proof generation. You can also use the WASM witnesses provided in the `cli/zkeys` folder.
:::

### Run CLI tests

You can find the tests in `maci/cli/tests`.

To run the tests first start a hardhat node in the background:

```bash
cd contracts
pnpm run hardhat &
cd ../cli
```

Then run the tests (this will run all tests):

```bash
pnpm run test
```

To run e2e without subsidy:

```bash
pnpm run test:e2e
```

To run e2e with subsidy:

```bash
pnpm run test:e2e-subsidy
```

To run e2e tests with normal voting (not quadratic voting):

```bash
pnpm run test:e2e-non-qv
```

### Run integration tests

You can find the tests in `maci/integrationTests/`.

You can run them with:

```bash
pnpm run test
```

### Pre-Compiled Artifacts for testing

The following compiled circuits and zkeys are available to download:

- [Prod && Ceremony](#prod-size-ceremony) (`6-8-2-3`)
- [Large](#large-size) (`7-9-3-4`)
- [Micro](#micro-size) (`10-2-1-2`)
- [Small](#small-size) (`4-6-3-4`)
- [Medium](#medium-size) (`7-7-3-3`)
- [6-8-3-3](#6-8-3-3)

### Dependency (if running on intel chip and using rapidsnark)

- glibc 2.11 (Default of Ubuntu 20.04 LTS)

### Prod Size Ceremony

:::info
These artifacts have undergong a trusted setup and can be used in production. Subsidy is not included.
:::

- [maci-ceremony-artifacts-v1.2.0.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.2.0/maci-ceremony-artifacts-v1.2.0.tar.gz) (0.76 GB)

### Large Size

:::danger
Please do not use in production. These artifacts have not undergone a trusted setup.
:::

- [zkeys-7-9-3-4.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-9-3-4/zkeys_7-9-3-4_glibc-211.tar.gz) (2.8 GB)
- [ProcessMessages_7-9-3-4_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-9-3-4/ProcessMessages_7-9-3-4_test.0.zkey) (3.8 GB)
  - generated using `powersOfTau28_hez_final_22.ptau`
- [TallyVotes_7-3-4_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-9-3-4/TallyVotes_7-3-4_test.0.zkey) (8.5 GB)
  - generated using `powersOfTau28_hez_final_23.ptau`

#### Message processing

| Parameter                | Value | Description                                    |
| ------------------------ | ----- | ---------------------------------------------- |
| State tree depth         | 7     | Allows 78,125 signups.                         |
| Message tree depth       | 9     | Allows 1,953,125 votes or key-change messages. |
| Message batch tree depth | 3     | Allows 125 messages to be processed per batch. |
| Vote option tree depth   | 4     | Allows 625 vote options.                       |

#### Vote tallying

| Parameter              | Value | Description                                        |
| ---------------------- | ----- | -------------------------------------------------- |
| State tree depth       | 7     | Allows 78,125 signups.                             |
| State leaf batch depth | 3     | Allows 125 user's votes to be processed per batch. |
| Vote option tree depth | 4     | Allows 625 vote options.                           |

#### Micro size

- [zkeys_10-2-1-2_glibc-211.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/10-2-1-2/zkeys_10-2-1-2_glibc-211.tar.gz) (403 MB)
- [ProcessMessages_10-2-1-2_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/10-2-1-2/ProcessMessages_10-2-1-2_test.0.zkey) (190 MB)
- [TallyVotes_10-1-2_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/10-2-1-2/TallyVotes_10-1-2_test.0.zkey) (71 MB)
- [SubsidyPerBatch_10-1-2_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/10-2-1-2/SubsidyPerBatch_10-1-2_test.0.zkey) (202 MB)

`*.zkey` files are generated using `powersOfTau28_hez_final_20.ptau`

#### Message processing

| Parameter                | Value | Description                                  |
| ------------------------ | ----- | -------------------------------------------- |
| State tree depth         | 10    | Allows 9,765,625 signups.                    |
| Message tree depth       | 2     | Allows 25 votes or key-change messages.      |
| Message batch tree depth | 1     | Allows 5 messages to be processed per batch. |
| Vote option tree depth   | 2     | Allows 25 vote options.                      |

#### Vote tallying

| Parameter              | Value | Description                                      |
| ---------------------- | ----- | ------------------------------------------------ |
| State tree depth       | 10    | Allows 9,765,625 signups.                        |
| State leaf batch depth | 1     | Allows 5 user's votes to be processed per batch. |
| Vote option tree depth | 2     | Allows 25 vote options.                          |

### Small size

:::danger
Please do not use in production. These artifacts have not undergone a trusted setup.
:::

- [zkeys_4-6-3-4_glibc-211.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/4-6-3-4/zkeys_4-6-3-4_glibc-211.tar.gz) (2.6 GB)
- [ProcessMessages_4-6-3-4_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/4-6-3-4/ProcessMessages_4-6-3-4_test.0.zkey) (2.9 GB)
  - generated using `powersOfTau28_hez_final_22.ptau`
- [TallyVotes_4-3-4_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/4-6-3-4/TallyVotes_4-3-4_test.0.zkey) (8.5 GB)
  - generated using `powersOfTau28_hez_final_23.ptau`

#### Message processing

| Parameter                | Value | Description                                    |
| ------------------------ | ----- | ---------------------------------------------- |
| State tree depth         | 4     | Allows 625 signups.                            |
| Message tree depth       | 6     | Allows 15,625 votes or key-change messages.    |
| Message batch tree depth | 3     | Allows 125 messages to be processed per batch. |
| Vote option tree depth   | 4     | Allows 625 vote options.                       |

#### Vote tallying

| Parameter              | Value | Description                                        |
| ---------------------- | ----- | -------------------------------------------------- |
| State tree depth       | 4     | Allows 9,765,625 signups.                          |
| State leaf batch depth | 3     | Allows 125 user's votes to be processed per batch. |
| Vote option tree depth | 2     | Allows 25 vote options.                            |

### Medium size

:::danger
Please do not use in production. These artifacts have not undergone a trusted setup.
:::

- [zkeys_7-7-3-3_glibc-211.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-7-3-3/zkeys_7-7-3-3_glibc-211.tar.gz) (4.9 GB)
- [ProcessMessages_7-7-3-3_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-7-3-3/ProcessMessages_7-7-3-3_test.0.zkey) (2.2 GB)
  - generated using `powersOfTau28_hez_final_22.ptau`
- [TallyVotes_7-3-3_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-7-3-3/TallyVotes_7-3-3_test.0.zkey) (884 MB)
  - generated using `powersOfTau28_hez_final_22.ptau`

#### Message processing

| Parameter                | Value | Description                                    |
| ------------------------ | ----- | ---------------------------------------------- |
| State tree depth         | 7     | Allows 78,125 signups.                         |
| Message tree depth       | 7     | Allows 78,125 votes or key-change messages.    |
| Message batch tree depth | 3     | Allows 125 messages to be processed per batch. |
| Vote option tree depth   | 3     | Allows 125 vote options.                       |

#### Vote tallying

| Parameter              | Value | Description                                        |
| ---------------------- | ----- | -------------------------------------------------- |
| State tree depth       | 7     | Allows 78,125 signups.                             |
| State leaf batch depth | 3     | Allows 125 user's votes to be processed per batch. |
| Vote option tree depth | 2     | Allows 25 vote options.                            |

### 6-8-3-3

:::danger
Please do not use in production. These artifacts have not undergone a trusted setup.
:::

- [zkeys_6-8-3-3_glibc-211.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/6-8-3-3/zkeys_6-8-3-3_glibc-211.tar.gz) (1.1 GB)
- [ProcessMessages_6-8-3-3_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/6-8-3-3/ProcessMessages_6-8-3-3_test.0.zkey) (3.4 GB)
  - generated using `powersOfTau28_hez_final_22.ptau`
- [TallyVotes_6-3-3_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/6-8-3-3/TallyVotes_6-3-3_test.0.zkey) (1.8 MB)
  - generated using `powersOfTau28_hez_final_22.ptau`

#### Message processing

| Parameter                | Value | Description                                    |
| ------------------------ | ----- | ---------------------------------------------- |
| State tree depth         | 6     | Allows 15,625 signups.                         |
| Message tree depth       | 8     | Allows 390,625 votes or key-change messages.   |
| Message batch tree depth | 3     | Allows 125 messages to be processed per batch. |
| Vote option tree depth   | 3     | Allows 125 vote options.                       |

#### Vote tallying

| Parameter              | Value | Description                                        |
| ---------------------- | ----- | -------------------------------------------------- |
| State tree depth       | 6     | Allows 15,625 signups.                             |
| State leaf batch depth | 3     | Allows 125 user's votes to be processed per batch. |
| Vote option tree depth | 2     | Allows 25 vote options.                            |
