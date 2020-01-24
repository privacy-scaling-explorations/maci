# Minimal Anti-Collusion Infrastructure

Please refer to the [implementation spec](./SPEC.md) for technical details, and
the original [ethresear.ch
post](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413) for a
high-level view.

We welcome contributions to this project. Please join our
[Telegram group](https://t.me/joinchat/LUgOpE7J2gstRcZqdERyvw) to discuss.

## Local development and testing

### Requirements

You should have Node 11.14.0 installed. Use
[`nvm`](https://github.com/nvm-sh/nvm) to install it.

**TODO:** Test this with Node 12 LTS.

### Get started

Clone this repository, install dependencies, and build the source code:

```bash
git clone git@github.com:barryWhiteHat/maci.git && \
npm i && \
npm run bootstrap && \
npm run build
```

### Local development

This repository is organised as Lerna submodules. Each submodule contains its
own unit tests.

- `config`: project-wide configuration files. Includes config files for both
  testing and production.
- `crypto`: low-level cryptographic operations.
- `circuits`: zk-SNARK circuits.
- `contracts`: Solidity contracts and deployment code.
- `domainobjs`: Classes which represent high-level [domain
  objects](https://wiki.c2.com/?DomainObject) particular to this project.

Subdirectories which are not Lerna submodules are:

- `docker`: Docker files for testing and deployment.

### Trusted setup

For development purposes, you can generate the proving and verifying keys for
the zk-SNARK circuits, along with their Solidity verifier contracts as such:

```bash
cd circuits
npm run buildBatchUpdateStateTreeSnark
npm run buildQuadVoteTallySnark
```

Alternatively, you can save time by downloading the files from Dropbox:

```
cd circuits
npm run downloadAllSnarks
```

### Testing

#### Unit tests

The following submodules contain unit tests: `crypto`, `circuits`, `contracts`, and `domainobjs`.

Except for the `contracts` submodule, run unit tests as such (the following
example is for `crypto`):

```bash
cd crypto
npm run test
```

For the `contracts` unit tests, run the tests one by one. This prevents
incorrect nonce errors.

First, start a Ganache instance in a separate terminal:

```bash
cd contracts
npm run ganache
```

In another terminal, run the tests individually:

```bash
cd contracts
npm run test-hasher
npm run test-maci
npm run ...
```

## Deploying contracts to the local testnet

Assuming that you have a Ganache node set up and listening to the path
configured in `config/test.yaml`:

```bash
cd contracts
npm run deploy
```

The addresses which the contracts have been deployed to will be saved in
`contracts/deployedAddresses.json`.

**TODO**: when we develop the CLI, this command should also copy the deployed
addresses to the CLI submodule.

## Deploying contracts to an Ethereum testnet or the mainnet

First, set the private key you need to deploy the contracts. The account
associated with the key should already have some ETH in it. Create this file in
your home directory (e.g. `/home/user/kovanPrivKey.json`) and replace the value
between the quote marks with the private key.

```json
["0x................................................................"]
```

There is an existing `kovan.yml` file in the `config` submodule. We will use it
as an example of deploying to the Kovan testnet.

```bash
cd contracts
NODE_ENV=kovan npm run deploy
```

If the deployment fails because of an error from the Ethereum node, change it in `kovan.yml`:

```yml
chain:
  url: "https://kovan.infura.io/v3/<your infura key>"
```
