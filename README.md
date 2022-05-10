# Minimal Anti-Collusion Infrastructure

Please refer to
the original [ethresear.ch
post](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413) for a
high-level view.

Documentation for developers and integrators can be found here:
https://appliedzkp.github.io/maci/

We welcome contributions to this project. Please join our
[Telegram group](https://t.me/joinchat/LUgOpE7J2gstRcZqdERyvw) to discuss.

## Local Development and testing

### Requirements

You should have Node 14 installed. Use `nvm` to install it and manage versions.

You also need a Ubuntu/Debian Linux machine on an Intel CPU.

### Get started

Install dependencies:
`sudo apt-get install build-essential libgmp-dev libssl-dev libsodium-dev git nlohmann-json3-dev nasm g++ libgcc-s1`

If you are missing the correct version of glibc see `circuits/scripts/installGlibc.sh`

Clone this repository, install NodeJS dependencies, and build the source code:

```bash
git clone git@github.com:appliedzkp/maci.git && \
cd maci && \
npm i && \
npm run bootstrap && \
npm run build
```

For development purposes, you can generate the proving and verifying keys for
the zk-SNARK circuits, along with their Solidity verifier contracts as such.

Navigate to the rapidsnark [repo](https://github.com/iden3/rapidsnark) to install the necessary tooling.

Build the zk-SNARKs and generate their proving and verifying keys:

```bash
cd circuits
npm run build-test-circuits
```

This should take no more than 5 minutes. We used to provide download links to
working versions of the keys and compiiled circuit files, but now that we can
use `snarkjs` to produce them very quickly, we no longer maintain them.

Note that if you change the circuits and recompile them, you should also update
and recompile the verifier contracts in `contracts/contracts` with their new
versions, or the tests will fail:


```bash
cd contracts
npm run compileSol
```

Avoid using `npx hardhat compile` and instead use the provided command as artifacts are copied into their relevant directories.

### Local development

This repository is organised as Lerna submodules. Each submodule contains its
own unit tests.

- `audit`: Documentation surrounding the audit performed on v1
- `crypto`: low-level cryptographic operations.
- `circuits`: zk-SNARK circuits.
- `contracts`: Solidity contracts and deployment code.
- `domainobjs`: Classes which represent high-level [domain
  objects](https://wiki.c2.com/?DomainObject) particular to this project.
- `core`: Business logic functions for message processing, vote tallying,
  and circuit input generation through `MaciState`, a state machine
  abstraction.
- `cli`: A command-line interface with which one can deploy and interact with
  an instance of MACI.
- `integrationTests`: Integration tests which use the command-line interface
  to perform end-to-end tests.

#### Compiling Circom

Prior to using the generated `zkey` files for corresponding circuits, it is now required to compile `circom` locally. To get started the follow the instructions [here](https://docs.circom.io/getting-started/installation/)
and be sure that the installation directory matches the value in the `circom` field inside `circuits/circomHelperConfig.json`.

For example:
```json
{
    "circom": "../$RELATIVE_PATH_TO_CIRCOM"
}
```

### Testing

### Unit tests

The following submodules contain unit tests: `core`, `crypto`, `circuits`,
`contracts`, and `domainobjs`.

Except for the `contracts` submodule, run unit tests as such (the following
example is for `crypto`):

```bash
cd crypto
npm run test
```

For `contracts` and `integrationTests`, run the tests one by one. This prevents
incorrect nonce errors.

First, start a Hardhat instance in a separate terminal:

```bash
cd contracts
npm run hardhat
```

In another terminal you can run:

```bash
cd contracts
npm run test
```

Or run tests individual as such:

```bash
cd contracts
npm run test-accQueue
npx jest AccQueue
```

Where both test commands run `AccQueue.test.ts`

Alternatively you can run all unit tests as follows, but you should
stop your Hardhat instance first as this will start its own instance
before running the tests:

```bash
cd contracts
./scripts/runTestsInCircleCi.sh
```

Or run all integration tests (this also starts its own Hardhat instance):

```bash
cd integrationTests
./scripts/runTestsInCircleCi.sh
```

You can ignore the Hardhat errors which this script emits as you should already
have Hardhat running in a separate terminal. Otherwise, you will have to exit
Ganache using the `kill` command.


### Docker

Run `docker build -t maci .` to build all stages.

To run a specific build step `docker build --target circuits -t maci .`
Note: a cached version of `builder` job must be on your system prior as it relies on existing artifacts

### CI pipeline

CI pipeline ensures that we have automated tests that constantly validate. For more information about pipeline workflows, see https://github.com/appliedzkp/maci/wiki/MACI-CI-pipeline.