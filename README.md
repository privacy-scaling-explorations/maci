# Minimal Anti-Collusion Infrastructure

[![CI][cli-actions-badge]][cli-actions-link]
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/privacy-scaling-explorations/maci/blob/dev/LICENSE)

Minimal Anti-Collusion Infrastructure (MACI) is an on-chain voting protocol which protects privacy and minimizes the risk of collusion and bribery.

**MACI blog, resources, and documentation for developers and integrators can be found here:
https://maci.pse.dev/**

We welcome contributions to this project. Please join our
[Discord server](https://discord.com/invite/sF5CT5rzrR) (in the `#🗳️-maci` channel) to discuss.

## Packages

Below you can find a list of the packages included in this repository.

| package                                           | npm                                                                     | tests                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [maci-circuits][circuits-package]                 | [![NPM Package][circuits-npm-badge]][circuits-npm-link]                 | [![Actions Status][circuits-actions-badge]][circuits-actions-link]                 |
| [maci-cli][cli-package]                           | [![NPM Package][cli-npm-badge]][cli-npm-link]                           | [![Actions Status][cli-actions-badge]][cli-actions-link]                           |
| [maci-contracts][contracts-package]               | [![NPM Package][contracts-npm-badge]][contracts-npm-link]               | [![Actions Status][contracts-actions-badge]][contracts-actions-link]               |
| [maci-core][core-package]                         | [![NPM Package][core-npm-badge]][core-npm-link]                         | [![Actions Status][core-actions-badge]][core-actions-link]                         |
| [maci-crypto][crypto-package]                     | [![NPM Package][crypto-npm-badge]][crypto-npm-link]                     | [![Actions Status][crypto-actions-badge]][crypto-actions-link]                     |
| [maci-domainobjs][domainobjs-package]             | [![NPM Package][domainobjs-npm-badge]][domainobjs-npm-link]             | [![Actions Status][domainobjs-actions-badge]][domainobjs-actions-link]             |
| [maci-integrationTests][integrationTests-package] | [![NPM Package][integrationTests-npm-badge]][integrationTests-npm-link] | [![Actions Status][integrationTests-actions-badge]][integrationTests-actions-link] |

## Development and testing

### Branches

The base branch of the project is `dev`, which is used for ongoing development.

This project uses tags for releases. [View all MACI releases](https://github.com/privacy-scaling-explorations/maci/releases).

To contribute to MACI, create feature/fix branches, then open PRs into `dev`. [Learn more about contributing](https://maci.pse.dev/docs/contributing).

### Local development

For installation and local development instructions, please see our [installation docs](https://maci.pse.dev/docs/installation/).

This repository is organized as Lerna submodules. Each submodule contains its
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

Please refer to the [testing documentation](https://maci.pse.dev/docs/testing) for more information.

### Docker

Run `docker build -t maci .` to build all stages.

To run a specific build step `docker build --target circuits -t maci .`
Note: a cached version of `builder` job must be on your system prior as it relies on existing artifacts

### CI pipeline

CI pipeline ensures that we have automated tests that constantly validate. For more information about pipeline workflows, [read our CI documentation](https://maci.pse.dev/docs/ci-pipeline).

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
