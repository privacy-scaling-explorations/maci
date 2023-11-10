# Minimal Anti-Collusion Infrastructure

[![CI][cli-actions-badge]][cli-actions-link]
![License](https://img.shields.io/badge/license-MIT-green)
[![Telegram][telegram-badge]][telegram-link]



Please refer to
the original [ethresear.ch
post](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413) for a
high-level view.

Documentation for developers and integrators can be found here:
https://privacy-scaling-explorations.github.io/maci/

We welcome contributions to this project. Please join our
[Telegram group][telegram-link] to discuss.

## Packages

Below you can find a list of the packages included in this repository.

| package | npm |  tests | 
|---------|-----|--------|
| [maci-circuits][circuits-package] | [![NPM Package][circuits-npm-badge]][circuits-npm-link] | [![Actions Status][circuits-actions-badge]][circuits-actions-link] |
| [maci-cli][cli-package] | [![NPM Package][cli-npm-badge]][cli-npm-link] | [![Actions Status][cli-actions-badge]][cli-actions-link] |
| [maci-common][common-package] | [![NPM Package][common-npm-badge]][common-npm-link] | [![Actions Status][common-actions-badge]][common-actions-link] |
| [maci-contracts][contracts-package] | [![NPM Package][contracts-npm-badge]][contracts-npm-link] | [![Actions Status][contracts-actions-badge]][contracts-actions-link] |
| [maci-core][core-package] | [![NPM Package][core-npm-badge]][core-npm-link] | [![Actions Status][core-actions-badge]][core-actions-link] |
| [maci-crypto][crypto-package] | [![NPM Package][crypto-npm-badge]][crypto-npm-link] | [![Actions Status][crypto-actions-badge]][crypto-actions-link] |
| [maci-domainobjs][domainobjs-package] | [![NPM Package][domainobjs-npm-badge]][domainobjs-npm-link] | [![Actions Status][domainobjs-actions-badge]][domainobjs-actions-link] |
| [maci-integrationTests][integrationTests-package] | [![NPM Package][integrationTests-npm-badge]][integrationTests-npm-link] | [![Actions Status][integrationTests-actions-badge]][integrationTests-actions-link] |
| [maci-server][server-package] | [![NPM Package][server-npm-badge]][server-npm-link] | [![Actions Status][server-actions-badge]][server-actions-link] |

## Local Development and testing

### Requirements

You should have Node.js v18 installed. Use `nvm` to install it and manage versions. This code has been tested with earlier Node versions (14 and 16), however we do recommend using Node 18.

You also need a Ubuntu/Debian Linux machine on an Intel CPU.

### Get started

Install dependencies:
`sudo apt-get install build-essential libgmp-dev libsodium-dev nlohmann-json3-dev nasm`

If you are missing the correct version of glibc see `circuits/scripts/installGlibc.sh`

Clone this repository, install Node.js dependencies, and build the source code:

```bash
git clone git@github.com:privacy-scaling-explorations/maci.git
cd maci
npm install
npm run bootstrap
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

This can take around 10 to 15 minutes, depending on the specs of your machine.

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


### Testing

### Unit tests

The following submodules contain unit tests: `core`, `crypto`, `circuits`,
`contracts`, and `domainobjs`.

You can run all unit tests from the root directory of the repo by running:

```bash
npm run test
```

Our you can run unit tests within each submodule. for example to run the `crypto` tests:

```bash
cd crypto
npm run test
```

<!-- TODO: confirm if true -->
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

Or run individual tests:

```bash
cd contracts
npm run test-accQueue
```

Where both test commands run `AccQueue.test.ts`

Alternatively you can run all unit tests as follows, but you should
stop your Hardhat instance first as this will start its own instance
before running the tests:

```bash
cd contracts
./scripts/runTestsInCi.sh
```

Or run all integration tests (this also starts its own Hardhat instance):

```bash
cd integrationTests
./scripts/runTestsInCi.sh
```

You can ignore the Hardhat errors which this script emits as you should already
have Hardhat running in a separate terminal. Otherwise, you will have to exit
Ganache using the `kill` command.


### Docker

Run `docker build -t maci .` to build all stages.

To run a specific build step `docker build --target circuits -t maci .`
Note: a cached version of `builder` job must be on your system prior as it relies on existing artifacts

### CI pipeline

CI pipeline ensures that we have automated tests that constantly validate. For more information about pipeline workflows, see https://github.com/privacy-scaling-explorations/maci/wiki/MACI-CI-pipeline.

[telegram-badge]: https://badges.aleen42.com/src/telegram.svg
[telegram-link]: https://t.me/joinchat/LUgOpE7J2gstRcZqdERyvw

[circuits-package]: ./circuits
[circuits-npm-badge]: https://img.shields.io/npm/v/maci-circuits.svg
[circuits-npm-link]: https://www.npmjs.com/package/maci-circuits
[circuits-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/circuit-build.yml/badge.svg
[circuits-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3ACircuit

[cli-package]: ./cli
[cli-npm-badge]: https://img.shields.io/npm/v/maci-cli.svg
[cli-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/e2e.yml/badge.svg
[cli-npm-link]: https://www.npmjs.com/package/maci-cli
[cli-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3ACI

[common-package]: ./common
[common-npm-badge]: https://img.shields.io/npm/v/maci-common.svg
[common-npm-link]: https://www.npmjs.com/package/maci-common
[common-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/build.yml/badge.svg
[common-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Acommon

[contracts-package]: ./contracts
[contracts-npm-badge]: https://img.shields.io/npm/v/maci-contracts.svg
[contracts-npm-link]: https://www.npmjs.com/package/maci-contracts
[contracts-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/contracts-build.yml/badge.svg
[contracts-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Acontracts

[core-package]: ./core
[core-npm-badge]: https://img.shields.io/npm/v/maci-core.svg
[core-npm-link]: https://www.npmjs.com/package/maci-core
[core-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/core-build.yml/badge.svg
[core-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Acore

[crypto-package]: ./crypto
[crypto-npm-badge]: https://img.shields.io/npm/v/maci-crypto.svg
[crypto-npm-link]: https://www.npmjs.com/package/maci-crypto
[crypto-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/crypto-build.yml/badge.svg
[crypto-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Acrypto

[domainobjs-package]: ./domainobjs
[domainobjs-npm-badge]: https://img.shields.io/npm/v/maci-domainobjs.svg
[domainobjs-npm-link]: https://www.npmjs.com/package/maci-domainobjs
[domainobjs-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/domainobjs-build.yml/badge.svg
[domainobjs-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Adomainobjs

[integrationTests-package]: ./integrationTests
[integrationTests-npm-badge]: https://img.shields.io/npm/v/maci-integrationtests.svg
[integrationTests-npm-link]: https://www.npmjs.com/package/maci-integrationtests
[integrationTests-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/e2e.yml/badge.svg
[integrationTests-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3ACI

[server-package]: ./server
[server-npm-badge]: https://img.shields.io/npm/v/maci-server.svg
[server-npm-link]: https://www.npmjs.com/package/maci-server
[server-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/build.yml/badge.svg
[server-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Aserver
