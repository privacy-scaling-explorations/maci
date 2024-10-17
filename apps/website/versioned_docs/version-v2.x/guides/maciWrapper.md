---
title: MACI Wrapper Guide Scaffold ETH 2 & MACI Voting Template
description: Introduction to the MACI Wrapper and Setup
sidebar_label: MACI Wrapper Guide
sidebar_position: 3
---

# MACI Wrapper Guide: [Scaffold ETH 2 & MACI Voting Template](https://github.com/yashgo0018/maci-wrapper) by [Yash](https://github.com/yashgo0018)

Welcome to the hacker guide for the Scaffold ETH 2 + MACI Voting Template! This guide will help you get started with the template, providing step-by-step instructions to set up and customize your decentralized voting application, understand MACI, and explore project ideas.

## Understanding MACI

### What is MACI?

Minimal Anti-Collusion Infrastructure (MACI) is a cryptographic protocol designed to enhance the privacy and security of voting systems on blockchain platforms. MACI ensures that votes are cast anonymously, preventing voters from being coerced or bribed. It combines several cryptographic techniques, including zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge) and Merkle trees, to achieve its anti-collusion goals.

### Key Features of MACI

- **Anonymity:** Ensures that the identity of the voter is concealed, making it impossible to link votes to individuals.
- **Collusion Resistance:** Prevents voters from proving how they voted, thereby deterring bribery and coercion.
- **Privacy:** Maintains the confidentiality of individual votes while allowing the aggregate result to be verified.

### How MACI Works

1. **Voter Registration:** Voters register their identities using a public-private key pair.
2. **Vote Casting:** Votes are encrypted and submitted to the MACI contract. When votes are processed, only votes of eligible users are counted.
3. **Tallying Votes:** After the voting period, the votes are decrypted and tallied in a way that ensures the privacy and integrity of the results.

## Quickstart Guide

### 1. Clone and Set Up the Project

Clone the project repository and install the dependencies:

```bash
git clone https://github.com/yashgo0018/maci-wrapper.git
cd maci-wrapper
yarn install
```

### 2. Download the zkeys for the MACI Circuits

In your first terminal window, run:

```bash
yarn download-zkeys
```

### 3. Update Environment Variables

Copy the example environment files to the required `.env` files:

```bash
cp packages/hardhat/.env.example packages/hardhat/.env
cp packages/nextjs/.env.example packages/nextjs/.env.local
```

Update the values of the environment variables in these new `.env` files.

### 4. Start a Local Ethereum Network

In your first terminal window, run:

```bash
yarn chain
```

This will start a local Ethereum network using Hardhat.

### 5. Deploy Contracts

In a second terminal window, deploy your contracts:

```bash
yarn deploy
```

### 6. Launch the NextJS Application

In a third terminal window, start the NextJS frontend:

```bash
yarn start
```

### 7. Compute Results

In a fourth terminal window, clone the MACI repository:

```bash
git clone git@github.com:privacy-scaling-explorations/maci.git
```

Copy the zkeys generated from the maci-wrapper repo to the CLI directory of the MACI repo:

```bash
cp -r ../maci-wrapper/packages/hardhat/zkeys ./cli
```

Install dependencies and build the MACI project:

```bash
pnpm i
pnpm run build
```

Copy the new contract addresses:

```bash
cp -r ../maci-wrapper/packages/contractAddresses.json ./cli/build/contractAddresses.json
```

Follow the MACI documentation to merge signups, merge messages, generate proof, and then you can upload the `tally.json` file to the admin panel after the poll is over.

### 8. Interact with Your DApp

Navigate to `http://localhost:3000` to interact with your decentralized application (dApp).

### 9. Modifications

You can modify the app configuration in `packages/nextjs/scaffold.config.ts` to change the target network and `packages/hardhat/constants.ts` is you want to update the zkeys or use your own custom contracts for `voice credit proxy`, `gate keeper`, `verifier` or `topup credits`.

#### Example Configuration Changes

To host your dApp on a separate network (e.g., Sepolia testnet), you need to update the following file:

1. **`packages/nextjs/scaffold.config.ts`**

```
...
const scaffoldConfig = {
  ...
  targetNetworks: [chains.sepolia],
...
```

2. **Deploying Contracts to Sepolia**

Ensure your `packages/hardhat/.env` file contains your private key and Alchemy project ID:

```env
DEPLOYER_PRIVATE_KEY=your_private_key
ALCHEMY_API_KEY=your_alchemy_project_id
```

Then, deploy your contracts to Sepolia:

```bash
yarn deploy --network sepolia
```

## Usage

### Register

Use the app's interface to register with the MACI contract and gain voting rights.

### Create Polls

As an admin, you can create polls with custom questions and options.

### Vote

Registered voters can participate in polls, utilizing MACI's secure voting mechanism.

### View Results

Access poll outcomes after the voting phase ends.

### Admin Dashboard

Monitor and manage ongoing polls, including viewing detailed poll status.
