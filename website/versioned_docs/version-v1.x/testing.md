---
title: Testing MACI
description: How to test MACI
sidebar_label: Testing
sidebar_position: 9
---

# Testing

### Unit tests

Unit tests within the project are built using [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/). Mocha is a test framework that provides the environment to write and run JavaScript tests, while Chai is an assertion library that allows us to write assertions in a more expressive and readable way.

The following submodules contain unit tests: `core`, `crypto`, `circuits`,
`contracts`, and `domainobjs`.

You can run all unit tests from the root directory of the repo by running:

```bash
npm run test
```

Or you can run unit tests within each submodule. for example to run the `crypto` tests:

```bash
cd crypto
npm run test
```

You can also run individual tests within submodules, for example:

```bash
cd contracts
npm run test-accQueue
```

This test command will run `AccQueue.test.ts`

## Contracts

First, compile the contracts.

From the main `maci/` directory, run:

```bash
cd contracts && \
npm run compileSol
```

To run Contracts only tests, run:

```bash
cd contracts && \
npm run test
```

## CLI

You can test the CLI locally. First, you need to either generate `.zkey` files,
or download them. Do not use these testing `.zkey` files in production.

### Download `.zkey` files or the witness generation binaries

MACI has three zk-SNARK circuits. Each circuit is parameterised. There should one
`.zkey` file for each circuit and set of parameters.

Unless you wish to generate a fresh set of `.zkey` files, you should obtain
them from someone who has performed a multi-party trusted setup for said
circuits.

Note the locations of the `.zkey` files as the CLI requires them as
command-line flags.

You cand download a `.zkey` files and associated `.r1cs` file with witness generation binaries from [here](https://github.com/privacy-scaling-explorations/maci/wiki/Download-Precompiled-Circuit-and-Zkeys).

### Compile the witness generation binaries

From the main `maci/cli` directory, run:

```
npx zkey-manager compile -c ./zkeys.config.yml
```

You should see the following files in `maci/cli/zkeys/`:

```
ProcessMessages_10-2-1-2_test
ProcessMessages_10-2-1-2_test.circom
ProcessMessages_10-2-1-2_test.dat
ProcessMessages_10-2-1-2_test.r1cs
ProcessMessages_10-2-1-2_test.sym
ProcessMessages_10-2-1-2_test_cpp
ProcessMessages_10-2-1-2_test_js
SubsidyPerBatch_10-1-2_test
SubsidyPerBatch_10-1-2_test.circom
SubsidyPerBatch_10-1-2_test.dat
SubsidyPerBatch_10-1-2_test.r1cs
SubsidyPerBatch_10-1-2_test.sym
SubsidyPerBatch_10-1-2_test_cpp
SubsidyPerBatch_10-1-2_test_js
TallyVotes_10-1-2_test
TallyVotes_10-1-2_test.circom
TallyVotes_10-1-2_test.dat
TallyVotes_10-1-2_test.r1cs
TallyVotes_10-1-2_test.sym
TallyVotes_10-1-2_test_cpp
TallyVotes_10-1-2_test_js
```

### Check the Rapidsnark binary

Next, ensure that the `prover` binary of `rapidsnark` is in
`~/rapidsnark/build/prover`.

### Run CLI tests

You can find the tests in `maci/cli/tests`.

To run all tests:

```bash
npm run test
```

To run e2e without subsidy:

```bash
npm run test:e2e
```

To run e2e with subsidy:

```bash
npm run test:e2e-subsidy
```

> Please note that these require a hardhat node running in the background for local testing. You can start one with `npm run hardhat` within the **contracts** folder.

### Run integration tests

You can find the tests in `maci/integrationTests/`.

You can run them with:

```bash
npm run test
```

## Pre-Compiled Artifacts for testing

The followingcompiled circuits and zkeys are available to download:

- [Prod](#prod-size) (`7-9-3-4`)
- [Micro](#micro-size) (`10-2-1-2`)
- [Small](#small-size) (`4-6-3-4`)
- [Medium](#medium-size) (`7-7-3-3`)
- [6-8-3-3](#6-8-3-3)

### Dependency (if running on intel chip and using rapidsnark)

- glibc 2.11 (Default of Ubuntu 20.04 LTS)

## Prod Size

- [zkeys-7-9-3-4.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-9-3-4/zkeys_7-9-3-4_glibc-211.tar.gz) (2.8 GB)
- [ProcessMessages_7-9-3-4_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-9-3-4/ProcessMessages_7-9-3-4_test.0.zkey) (3.8 GB)
  - generated using `powersOfTau28_hez_final_22.ptau`
- [TallyVotes_7-3-4_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-9-3-4/TallyVotes_7-3-4_test.0.zkey) (8.5 GB)
  - generated using `powersOfTau28_hez_final_23.ptau`

### Message processing

| Parameter                | Value | Description                                    |
| ------------------------ | ----- | ---------------------------------------------- |
| State tree depth         | 7     | Allows 78,125 signups.                         |
| Message tree depth       | 9     | Allows 1,953,125 votes or key-change messages. |
| Message batch tree depth | 3     | Allows 125 messages to be processed per batch. |
| Vote option tree depth   | 4     | Allows 625 vote options.                       |

### Vote tallying

| Parameter                | Value | Description                                        |
| ------------------------ | ----- | -------------------------------------------------- |
| State tree depth         | 7     | Allows 78,125 signups.                             |
| State leaf batch depth   | 3     | Allows 125 user's votes to be processed per batch. |
| Message batch tree depth | 4     | Allows 625 messages to be processed per batch.     |

## Micro size

- [zkeys_10-2-1-2_glibc-211.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/10-2-1-2/zkeys_10-2-1-2_glibc-211.tar.gz) (403 MB)
- [ProcessMessages_10-2-1-2_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/10-2-1-2/ProcessMessages_10-2-1-2_test.0.zkey) (190 MB)
- [TallyVotes_10-1-2_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/10-2-1-2/TallyVotes_10-1-2_test.0.zkey) (71 MB)
- [SubsidyPerBatch_10-1-2_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/10-2-1-2/SubsidyPerBatch_10-1-2_test.0.zkey) (202 MB)

`*.zkey` files are generated using `powersOfTau28_hez_final_20.ptau`

### Message processing

| Parameter                | Value | Description                                  |
| ------------------------ | ----- | -------------------------------------------- |
| State tree depth         | 10    | Allows 9,765,625 signups.                    |
| Message tree depth       | 2     | Allows 25 votes or key-change messages.      |
| Message batch tree depth | 1     | Allows 5 messages to be processed per batch. |
| Vote option tree depth   | 2     | Allows 25 vote options.                      |

### Vote tallying

| Parameter                | Value | Description                                      |
| ------------------------ | ----- | ------------------------------------------------ |
| State tree depth         | 10    | Allows 9,765,625 signups.                        |
| State leaf batch depth   | 1     | Allows 5 user's votes to be processed per batch. |
| Message batch tree depth | 2     | Allows 25 messages to be processed per batch.    |

## Small size

- [zkeys_4-6-3-4_glibc-211.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/4-6-3-4/zkeys_4-6-3-4_glibc-211.tar.gz) (2.6 GB)
- [ProcessMessages_4-6-3-4_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/4-6-3-4/ProcessMessages_4-6-3-4_test.0.zkey) (2.9 GB)
  - generated using `powersOfTau28_hez_final_22.ptau`
- [TallyVotes_4-3-4_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/4-6-3-4/TallyVotes_4-3-4_test.0.zkey) (8.5 GB)
  - generated using `powersOfTau28_hez_final_23.ptau`

### Message processing

| Parameter                | Value | Description                                    |
| ------------------------ | ----- | ---------------------------------------------- |
| State tree depth         | 4     | Allows 625 signups.                            |
| Message tree depth       | 6     | Allows 15,625 votes or key-change messages.    |
| Message batch tree depth | 3     | Allows 125 messages to be processed per batch. |
| Vote option tree depth   | 4     | Allows 625 vote options.                       |

### Vote tallying

| Parameter                | Value | Description                                        |
| ------------------------ | ----- | -------------------------------------------------- |
| State tree depth         | 4     | Allows 9,765,625 signups.                          |
| State leaf batch depth   | 3     | Allows 125 user's votes to be processed per batch. |
| Message batch tree depth | 4     | Allows 625 messages to be processed per batch.     |

## Medium size

- [zkeys_7-7-3-3_glibc-211.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-7-3-3/zkeys_7-7-3-3_glibc-211.tar.gz) (4.9 GB)
- [ProcessMessages_7-7-3-3_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-7-3-3/ProcessMessages_7-7-3-3_test.0.zkey) (2.2 GB)
  - generated using `powersOfTau28_hez_final_22.ptau`
- [TallyVotes_7-3-3_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/7-7-3-3/TallyVotes_7-3-3_test.0.zkey) (884 MB)
  - generated using `powersOfTau28_hez_final_22.ptau`

### Message processing

| Parameter                | Value | Description                                    |
| ------------------------ | ----- | ---------------------------------------------- |
| State tree depth         | 7     | Allows 78,125 signups.                         |
| Message tree depth       | 7     | Allows 78,125 votes or key-change messages.    |
| Message batch tree depth | 3     | Allows 125 messages to be processed per batch. |
| Vote option tree depth   | 3     | Allows 125 vote options.                       |

### Vote tallying

| Parameter                | Value | Description                                        |
| ------------------------ | ----- | -------------------------------------------------- |
| State tree depth         | 7     | Allows 78,125 signups.                             |
| State leaf batch depth   | 3     | Allows 125 user's votes to be processed per batch. |
| Message batch tree depth | 3     | Allows 125 messages to be processed per batch.     |

## 6-8-3-3

- [zkeys_6-8-3-3_glibc-211.tar.gz](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/6-8-3-3/zkeys_6-8-3-3_glibc-211.tar.gz) (1.1 GB)
- [ProcessMessages_6-8-3-3_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/6-8-3-3/ProcessMessages_6-8-3-3_test.0.zkey) (3.4 GB)
  - generated using `powersOfTau28_hez_final_22.ptau`
- [TallyVotes_6-3-3_test.0.zkey](https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/6-8-3-3/TallyVotes_6-3-3_test.0.zkey) (1.8 MB)
  - generated using `powersOfTau28_hez_final_22.ptau`

### Message processing

| Parameter                | Value | Description                                    |
| ------------------------ | ----- | ---------------------------------------------- |
| State tree depth         | 6     | Allows 15,625 signups.                         |
| Message tree depth       | 8     | Allows 390,625 votes or key-change messages.   |
| Message batch tree depth | 3     | Allows 125 messages to be processed per batch. |
| Vote option tree depth   | 3     | Allows 125 vote options.                       |

### Vote tallying

| Parameter                | Value | Description                                        |
| ------------------------ | ----- | -------------------------------------------------- |
| State tree depth         | 7     | Allows 15,625 signups.                             |
| State leaf batch depth   | 3     | Allows 125 user's votes to be processed per batch. |
| Message batch tree depth | 3     | Allows 125 messages to be processed per batch.     |

## contents of `*.tar.gz`

It contains compiled result of the circuit:

```
zkeys/
zkeys/ProcessMessages_7-9-3-4_test.sym
zkeys/ProcessMessages_7-9-3-4_test.circom
zkeys/ProcessMessages_7-9-3-4_test.dat
zkeys/TallyVotes_7-3-4_test_js/
zkeys/TallyVotes_7-3-4_test_js/TallyVotes_7-3-4_test.wasm
zkeys/TallyVotes_7-3-4_test_js/witness_calculator.js
zkeys/TallyVotes_7-3-4_test_js/TallyVotes_7-3-4_test.wat
zkeys/TallyVotes_7-3-4_test_js/generate_witness.js
zkeys/TallyVotes_7-3-4_test.sym
zkeys/TallyVotes_7-3-4_test.dat
zkeys/ProcessMessages_7-9-3-4_test.r1cs
zkeys/ProcessMessages_7-9-3-4_test
zkeys/ProcessMessages_7-9-3-4_test_cpp/
zkeys/ProcessMessages_7-9-3-4_test_cpp/fr.asm
zkeys/ProcessMessages_7-9-3-4_test_cpp/calcwit.cpp
zkeys/ProcessMessages_7-9-3-4_test_cpp/fr.hpp
zkeys/ProcessMessages_7-9-3-4_test_cpp/ProcessMessages_7-9-3-4_test.o
zkeys/ProcessMessages_7-9-3-4_test_cpp/calcwit.o
zkeys/ProcessMessages_7-9-3-4_test_cpp/main.o
zkeys/ProcessMessages_7-9-3-4_test_cpp/main.cpp
zkeys/ProcessMessages_7-9-3-4_test_cpp/ProcessMessages_7-9-3-4_test.cpp
zkeys/ProcessMessages_7-9-3-4_test_cpp/fr.o
zkeys/ProcessMessages_7-9-3-4_test_cpp/circom.hpp
zkeys/ProcessMessages_7-9-3-4_test_cpp/calcwit.hpp
zkeys/ProcessMessages_7-9-3-4_test_cpp/fr.cpp
zkeys/ProcessMessages_7-9-3-4_test_cpp/Makefile
zkeys/ProcessMessages_7-9-3-4_test_cpp/fr_asm.o
zkeys/ProcessMessages_7-9-3-4_test_js/
zkeys/ProcessMessages_7-9-3-4_test_js/witness_calculator.js
zkeys/ProcessMessages_7-9-3-4_test_js/ProcessMessages_7-9-3-4_test.wasm
zkeys/ProcessMessages_7-9-3-4_test_js/ProcessMessages_7-9-3-4_test.wat
zkeys/ProcessMessages_7-9-3-4_test_js/generate_witness.js
zkeys/TallyVotes_7-3-4_test_cpp/
zkeys/TallyVotes_7-3-4_test_cpp/fr.asm
zkeys/TallyVotes_7-3-4_test_cpp/calcwit.cpp
zkeys/TallyVotes_7-3-4_test_cpp/TallyVotes_7-3-4_test.cpp
zkeys/TallyVotes_7-3-4_test_cpp/fr.hpp
zkeys/TallyVotes_7-3-4_test_cpp/calcwit.o
zkeys/TallyVotes_7-3-4_test_cpp/main.o
zkeys/TallyVotes_7-3-4_test_cpp/main.cpp
zkeys/TallyVotes_7-3-4_test_cpp/fr.o
zkeys/TallyVotes_7-3-4_test_cpp/circom.hpp
zkeys/TallyVotes_7-3-4_test_cpp/calcwit.hpp
zkeys/TallyVotes_7-3-4_test_cpp/fr.cpp
zkeys/TallyVotes_7-3-4_test_cpp/TallyVotes_7-3-4_test.o
zkeys/TallyVotes_7-3-4_test_cpp/Makefile
zkeys/TallyVotes_7-3-4_test_cpp/fr_asm.o
zkeys/TallyVotes_7-3-4_test.r1cs
zkeys/TallyVotes_7-3-4_test.circom
zkeys/TallyVotes_7-3-4_test
```

---

## Contribution Hash

- [ProcessMessages_4-6-3-4_test.0.zkey](#ProcessMessages_4-6-3-4_test0zkey)
- [TallyVotes_4-3-4_test.0.zkey](#TallyVotes_4-3-4_test0zkey)
- [ProcessMessages_7-9-3-4_test.0.zkey](#ProcessMessages_7-9-3-4_test0zkey)
- [TallyVotes_7-3-3_test.0.zkey](#TallyVotes_7-3-4_test0zkey)
- [ProcessMessages_10-2-1-2_test.0.zkey](#ProcessMessages_10-2-1-2_test0zkey)
- [TallyVotes_7-3-3_test.0.zkey](#TallyVotes_7-3-3_test0zkey)
- [SubsidyPerBatch_10-1-2_test.0.zkey](#SubsidyPerBatch_10-1-2_test0zkey)
- [ProcessMessages_7-7-3-3_test.0.zkey](#ProcessMessages_7-7-3-3_test0zkey)
- [TallyVotes_7-3-3_test.0.zkey](#TallyVotes_7-3-3_test0zkey)

### ProcessMessages_4-6-3-4_test.0.zkey

```
2d29ddba 11e5292e b20f681d 3ade88cd
5c93852b 52f400b0 779e9413 03a49e35
55b27b66 db5fec74 c8e01b0a c407b08f
325cfc06 cb1ac909 38b2e5ff 22b34333
```

### TallyVotes_4-3-4_test.0.zkey

```
d2d88532 c2e1e7bd 3c7be3fb f85da2e2
897d11d3 d1231639 25f557e4 e5dda0fd
454eb84a 04bf7d6d 525895fd 8168b14b
f3a8a155 cd338e2c 5f364836 bfd7913d
```

### ProcessMessages_7-9-3-4_test.0.zkey

```
75256709 6e8a034e a067ea67 16192fb2
57bd982a e202b12f 4a1381ac 362ca197
07ca0d33 c1ca2438 2c283eca 463c3c4d
b1094e74 b8aaa9a3 9af75b22 0d9229e6
```

### TallyVotes_7-3-4_test.0.zkey

```
f44cf32e 1709e2c4 c8dbe8dc 5b6de4be
30b9a60c 0ddefacc af33a1d0 f54f57a2
6eed2430 87d00e29 5bf068fd 9d89c323
9b6ced66 c970a87d 745d35e4 5f47d7f9
```

### ProcessMessages_10-2-1-2_test.0.zkey

```
23eb4980 d584c7ef 647478b9 dea49a6d
2c595cd0 43a0e9f2 e83fbfb7 b2fd7617
6fbe4b6f ba7f1f82 566c443d a8f0fec6
1c2c2662 20e0df3d 12a057f3 2a071937
```

### TallyVotes_10-1-2_test.0.zkey

```
ae12edd2 6f7f1d25 530177ab 27483fe0
ce9a8c26 9f015c49 203376da 911e295c
3f205792 5d661350 da391f34 16986d6a
61be4031 56220ca7 06ed3b9f e8504f11
```

### SubsidyPerBatch_10-1-2_test.0.zkey

```
16dfc388 eda0bfd7 ff529e42 505ed6b7
cbffbb79 9218b09b cfa2fe29 0806097a
52f4839f 58ff692b 2f572309 980f218b
c84bb980 a1346082 fb00a947 3c97d99e
```

### ProcessMessages_7-7-3-3_test.0.zkey

```
e688264b e1326553 b58492d4 7c2028bc
cda175f9 b786c4eb 44453080 369ab861
590816fe 257c1fe1 e079415b e4e1b626
a0f752f8 413a81ba f481d335 187e0091
```

### TallyVotes_7-3-3_test.0.zkey

```
6869646d 1faf2aec d8c70c85 0021858f
8c17db02 ede8be90 9a49924c 665c931f
66673899 095159c8 2a236903 4774f42b
225e270f b446f8ec 33545826 3e9444b9
```
