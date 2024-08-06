---
title: Installing MACI
description: How to install MACI
sidebar_label: Installation
sidebar_position: 1
---

# Installation

## Requirements

You need the following to use MACI:

- Node.js: use a JS toolchain manager like [`nvm`](https://github.com/nvm-sh/nvm) or [`volta`](https://volta.sh/) to install Node.js. We recommend using Node 20 or above.
- The [`rapidsnark`](https://github.com/iden3/rapidsnark) tool if running on an intel chip (this allows for faster proof generation vs snarkjs).

> Note that MACI works on Linux and MacOS. It has not been tested on Windows, however it should work on Windows Subsystem for Linux (WSL). Keep in mind that when using MACI e2e on a non intel chip, tests will run using snarkjs with WASM. This will result in slower proof generation.

## Installation

### Install `rapidsnark` (if on an intel chip)

First, install dependencies:

```bash
sudo apt-get install build-essential cmake libgmp-dev libsodium-dev nasm curl m4
```

If you're running on **MacOS with an intel chip**, install dependencies by running the following command:

```bash
brew install cmake gmp libsodium nasm
```

Next, clone `rapidsnark` and build it:

```bash
git clone https://github.com/iden3/rapidsnark.git && \
cd rapidsnark

pnpm install && \
git submodule init && \
git submodule update && \
./build_gmp.sh host && \
mkdir build_prover && cd build_prover && \
cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=../package && \
make -j4 && make install
```

Note the location of the `rapidsnark` binary (e.g.
`/home/user/rapidsnark/build/prover`).

For more information, please check rapidsnark [github repo](https://github.com/iden3/rapidsnark)

### Install circom v2:

https://docs.circom.io/

Note the location of the `circom` binary (e.g. `$HOME/.cargo/bin/circom`), as you will need it later.

### Install MACI

```bash
git clone https://github.com/privacy-scaling-explorations/maci.git && \
cd maci && \
pnpm i && \
pnpm run build
```

:::info
Depending on the number of signups you would like to support, you will be required to re-compile the contracts with a different STATE_TREE_DEPTH parameter. This is by default 10 and can be used for testing purposes. For more information about the parameters please refer to the [circuits page](/docs/developers-references/zk-snark-circuits/setup#parameters).

To re-compile with a different state tree depth parameter please run:

`export STATE_TREE_DEPTH=$ENTER_VALUE_HERE && pnpm build`
:::

#### On Intel chips (no ARM64)

Install dependencies:

```bash
sudo apt-get install libgmp-dev nlohmann-json3-dev nasm g++
```

:::info
Remember that if on a ARM64 chip, you will not be able to compile the c++ witness generator and thus use rapidsnark. Please follow instructions for WASM artifacts, in case you decide to recompile artifacts.
:::

### Decide whether you need to compile new circuits or use the test ones

If you are going to be making any changes to the circom circuits, then the following will apply to you. Otherwise, you can skip to the [Download `.zkey` files](#download-zkey-files-if-you-would-like-to-use-the-default-parameters-or-the-trusted-setup-artifacts) section.

#### Configure circomkit

Edit `circuits/circom/circuits` to include the circuits you would like to compile. This comes already configured with the three main circuits and with testing parameters:

```json
{
  "ProcessMessages_10-2-1-2_test": {
    "file": "processMessages",
    "template": "ProcessMessages",
    "params": [10, 2, 1, 2],
    "pubs": [
      "numSignUps",
      "index",
      "batchEndIndex",
      "msgRoot",
      "currentSbCommitment",
      "newSbCommitment",
      "pollEndTimestamp",
      "actualStateTreeDepth",
      "coordinatorPublicKeyHash"
    ]
  },
  "ProcessMessagesNonQv_10-2-1-2_test": {
    "file": "processMessagesNonQv",
    "template": "ProcessMessagesNonQv",
    "params": [10, 2, 1, 2],
    "pubs": [
      "numSignUps",
      "index",
      "batchEndIndex",
      "msgRoot",
      "currentSbCommitment",
      "newSbCommitment",
      "pollEndTimestamp",
      "actualStateTreeDepth",
      "coordinatorPublicKeyHash"
    ]
  },
  "TallyVotes_10-1-2_test": {
    "file": "tallyVotes",
    "template": "TallyVotes",
    "params": [10, 1, 2],
    "pubs": ["index", "numSignUps", "sbCommitment", "currentTallyCommitment", "newTallyCommitment"]
  },
  "TallyVotesNonQv_10-1-2_test": {
    "file": "tallyVotesNonQv",
    "template": "TallyVotesNonQv",
    "params": [10, 1, 2],
    "pubs": ["index", "numSignUps", "sbCommitment", "currentTallyCommitment", "newTallyCommitment"]
  }
}
```

### Generate `.zkey` files

If you wish to generate `.zkey` files from scratch, first navigate to `circuits/circom`
and edit `circuits.json`. Set the parameters you need.

Next, run the following to compile the circuits with parameters you specified:

**for the c++ witness generator**

```bash
pnpm test:circuits-c -- --outPath ../cli/zkeys
```

**for the wasm witness generator**

```bash
pnpm build:circuits-wasm -- --outPath ../cli/zkeys
```

Finally, generate the `.zkey` files. This may require a lot of memory and time.

```bash
pnpm setup:zkeys -- --outPath ../cli/zkeys
```

> If on a ARM64 chip, the above will work with the wasm witness only. The errors you will get for the c++ witness are:
>
> ```bash
> main.cpp:9:10: fatal error: 'nlohmann/json.hpp' file not found
> #include <nlohmann/json.hpp>
>        ^~~~~~~~~~~~~~~~~~~
> 1 error generated.
> ```

### Download `.zkey` files (if you would like to use the default parameters or the trusted setup artifacts)

MACI has two main zk-SNARK circuits (plus an optional Subsidy circuit). Each circuit is parameterised. There should be one
`.zkey` file for each circuit and set of parameters.

Unless you wish to generate a fresh set of `.zkey` files, you should obtain
them from someone who has performed a multi-party trusted setup for said
circuits. For more details on which artifacts have undergone a trusted setup, please refer to the [Trusted Setup](/docs/security/trusted-setup) page.

Note the locations of the `.zkey` files as the CLI requires them as command-line flags.

**Download test artifacts**

If using the latest dev updates:

```bash
pnpm download-zkeys:test
```

**Download ceremony artifacts**

:::info
Currently, the ceremony artifacts work with MACI version up to 1.2.5.
:::

```bash
pnpm download-zkeys:ceremony
```
