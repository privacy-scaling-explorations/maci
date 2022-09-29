# vkRegistry-deployer

`vkRegistry` is the tool to deploy vkRegistry contract. It supports `create2` to maintain same address across networks.

## Quick Start

Deploy to hardhat network:

```shell
npm install

npm run deploy
```

## Deploy to remote network

### Set EOA

1. Rename `.env.example` to `.env`
2. Set `WALLET_MNEMONIC` or `WALLET_PRIVATE_KEY` field of `.env` file

### Deploy vkRegistry to designated network

Run following command to deploy it to Arbitrum:

```shell
npm run deploy:arbitrum
```

## Deploy vkRegistry contract while keeping same contract address across networks

1. Get a new EOA to ensure its nonces are same across networks
2. Run deploy script using the new EOA