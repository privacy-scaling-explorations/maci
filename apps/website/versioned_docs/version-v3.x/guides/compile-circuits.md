---
title: Compile Circuits
description: Compile new circuits
sidebar_label: Compile Circuits
sidebar_position: 4
---

# Compile Circuits

:::note
This guide is only useful if you need an specific configurations for number of users, votes, etc. If you plant to use the new circuits in production, make sure they go through a trusted ceremony.
:::

## Installation

### Requirements

You need the following to generate new circuits:

- The [`rapidsnark`](https://github.com/iden3/rapidsnark) tool if running on an intel chip (this allows for faster proof generation vs snarkjs).

:::note
MACI works on Linux and MacOS. It has not been tested on Windows, however it should work on Windows Subsystem for Linux (WSL). Keep in mind that when using MACI e2e on a non intel chip, tests will run using snarkjs with WASM. This will result in slower proof generation.
:::

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

#### On Intel chips (no ARM64)

Install dependencies:

```bash
sudo apt-get install libgmp-dev nlohmann-json3-dev nasm g++
```

:::info
Remember that if on a ARM64 chip, you will not be able to compile the c++ witness generator and thus use rapidsnark. Please follow instructions for WASM artifacts, in case you decide to recompile artifacts.
:::

### Configure circomkit

Edit `circuits/circom/circuits` to include the circuits you would like to compile. This comes already configured with the two main coordinator circuits, in both qv and non qv variants, as well as the client side circuit. The parameters are designed to support testing use cases:

```json
{
  "PollJoining_10_test": {
    "file": "./anon/voter/PollJoining",
    "template": "PollJoining",
    "params": [10],
    "pubs": ["nullifier", "stateRoot", "pollPublicKey", "pollId"]
  },
  "PollJoined_10_test": {
    "file": "./anon/voter/PollJoined",
    "template": "PollJoined",
    "params": [10],
    "pubs": ["stateRoot"]
  },
  "ProcessMessages_10-20-2_test": {
    "file": "./core/qv/processMessages",
    "template": "ProcessMessages",
    "params": [10, 20, 2],
    "pubs": [
      "totalSignups",
      "index",
      "batchEndIndex",
      "currentSbCommitment",
      "newSbCommitment",
      "outputBatchHash",
      "actualStateTreeDepth",
      "coordinatorPublicKeyHash",
      "voteOptions"
    ]
  },
  "ProcessMessagesNonQv_10-20-2_test": {
    "file": "./core/non-qv/processMessages",
    "template": "ProcessMessagesNonQv",
    "params": [10, 20, 2],
    "pubs": [
      "totalSignups",
      "index",
      "batchEndIndex",
      "currentSbCommitment",
      "newSbCommitment",
      "outputBatchHash",
      "actualStateTreeDepth",
      "coordinatorPublicKeyHash",
      "voteOptions"
    ]
  },
  "TallyVotes_10-1-2_test": {
    "file": "./core/qv/tallyVotes",
    "template": "TallyVotes",
    "params": [10, 1, 2],
    "pubs": ["index", "totalSignups", "sbCommitment", "currentTallyCommitment", "newTallyCommitment"]
  },
  "TallyVotesNonQv_10-1-2_test": {
    "file": "./core/non-qv/tallyVotes",
    "template": "TallyVotesNonQv",
    "params": [10, 1, 2],
    "pubs": ["index", "totalSignups", "sbCommitment", "currentTallyCommitment", "newTallyCommitment"]
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
