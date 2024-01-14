---
title: Installing MACI
description: How to install MACI
sidebar_label: Installation
sidebar_position: 3
---

# Installation

## Requirements

You need the following to use MACI:

- Node.js: use [`nvm`](https://github.com/nvm-sh/nvm) to install it. MACI has
  been tested with Node 14, 16, 18 and 20. We do however recommend to use Node 18 or Node 20 as Node 14 is deprecated and Node 16 will soon be deprecated too.
- The [`rapidsnark`](https://github.com/iden3/rapidsnark) tool if running on an intel chip (this allows for faster proof generation vs snarkjs).

> Note that MACI works on Linux and MacOS. It has not been tested on Windows, however it should work on Windows Subsystem for Linux (WSL). Keep in mind that when using MACI e2e on a non intel chip, tests will run using snarkjs with WASM. This will result in slower proof generation.

## Installation

### Install `rapidsnark` (if on an intel chip)

First, install dependencies:

```bash
sudo apt-get install build-essential libgmp-dev libsodium-dev nasm git
```

Next, clone `rapidsnark` and build it:

```bash
git clone https://github.com/iden3/rapidsnark.git && \
cd rapidsnark && \
git checkout 1c13721de4a316b0b254c310ccec9341f5e2208e

pnpm install && \
git submodule init && \
git submodule update && \
pnpm exec task createFieldSources && \
pnpm exec task buildProver
```

Note the location of the `rapidsnark` binary (e.g.
`/home/user/rapidsnark/build/prover`).

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

#### On intel chips

Install dependencies to compile the c++ witness generator:

```bash
sudo apt-get install libgmp-dev nlohmann-json3-dev nasm g++
```

> Note that on an ARM macbook you won't need the above. However, you will not be able to compile the c++ witness generator.

### Configure circomkit

Edit `circuits/circom/circuits` to include the circuits you would like to compile. This comes already configured with the three main circuits and with testing parameters:

```json
{
  "ProcessMessages_10-2-1-2_test": {
    "file": "processMessages",
    "template": "ProcessMessages",
    "params": [10, 2, 1, 2],
    "pubs": ["inputHash"]
  },
  "TallyVotes_10-1-2_test": {
    "file": "tallyVotes",
    "template": "TallyVotes",
    "params": [10, 1, 2],
    "pubs": ["inputHash"]
  },
  "SubsidyPerBatch_10-1-2_test": {
    "file": "subsidy",
    "template": "SubsidyPerBatch",
    "params": [10, 1, 2],
    "pubs": ["inputHash"]
  }
}
```

### Download `.zkey` files (if you would like to use the default parameters or the trusted setup artifacts)

MACI has two main zk-SNARK circuits (plus an optional Subsidy circuit). Each circuit is parameterised. There should one
`.zkey` file for each circuit and set of parameters.

Unless you wish to generate a fresh set of `.zkey` files, you should obtain
them from someone who has performed a multi-party trusted setup for said
circuits. For more details on which artifacts have undergone a trusted setup, please refer to the [Trusted Setup](/docs/trusted-setup) page.

Note the locations of the `.zkey` files as the CLI requires them as command-line flags.

**Download test artifacts**

```bash
pnpm download:test-zkeys
```

**Download ceremony artifacts**

```bash
pnpm download:ceremony-zkeys
```

### Generate `.zkey` files

If you wish to generate `.zkey` files from scratch, first navigate to `circuits/circom`
and edit `circuits.json`. Set the parameters you need.

Next, run the following to compile the circuits with parameters you specified:

**for the c++ witness generator**

```bash
pnpm test:circuits-c
```

**for the wasm witness generator**

```bash
pnpm build:circuits-wasm
```

Finally, generate the `.zkey` files. This may require a lot of memory and time.

```bash
pnpm setup:zkeys
```

> If on a ARM64 chip, the above will work with the wasm witness only. The errors you will get for the c++ witness are:
>
> ```bash
> main.cpp:9:10: fatal error: 'nlohmann/json.hpp' file not found
> #include <nlohmann/json.hpp>
>        ^~~~~~~~~~~~~~~~~~~
> 1 error generated.
> ```
