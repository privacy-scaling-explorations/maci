# poseidon-deployer

`poseidon-deployer` is the tool to deploy Poseidon hash functions. It supports `create2` to maintain the same address across networks.

## Quick Start

Deploy to hardhat network:

```shell
npm install

npm run build
npm run deploy
```

## Deploy to remote network

### Set EOA

1. Rename `.env.example` to `.env`
2. Set `WALLET_MNEMONIC` or `WALLET_PRIVATE_KEY` field of `.env` file

### Deploy Poseidon to designated network

Run following command to deploy it to Arbitrum:

```shell
npm run deploy:arbitrum
```

## Test

```shell
# Install dependencies for `maci-crypto`
cd ../../crpyto
npm install

npm run test
```

## Deploy Poseidon contract while keeping same contract address across networks

1. Get a new EOA to ensure its nonces are same across networks
2. Run deploy script using the new EOA
