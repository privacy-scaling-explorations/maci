---
slug: getting-started-with-maci
title: Getting Started with MACI
description: Guide to use MACI
authors:
  name: Crisgarner
  title: MACI team contributor
  url: https://x.com/crisgarner
  image_url: https://avatars.githubusercontent.com/u/578688?v=4
tags: [voting, security, anonymity, roadmap, community, MACI, development]
excerpt: "Get Started with MACI"
---

Hey folks! We’re thrilled to kick off a series of tutorials covering everything you need to know about MACI. This guide will focus on installing MACI and deploying the contracts to a testnet. Let’s get started!

## Understanding Roles

MACI protocol has two main roles, User (Voter) and Coordinator. A simplified version would be to say that the coordinator is in charge of deploying the MACI smart contracts, initiating the polls, tallying the final results of a vote, and finalizing polls by publishing the final results on-chain. Usually the contract deployer is the coordinator, but this can be a separate entity.

## Requirements

Let's install the required tools first:

- Node.js: use a JS toolchain manager like [`nvm`](https://github.com/nvm-sh/nvm) or [`volta`](https://volta.sh/) to install Node.js. We recommend using Node 20 or above.
- [pnpm](https://pnpm.io/installation): Fast, disk space efficient package manager.

## Installation

Now you can run the following commands to install MACI locally:

```bash
git clone https://github.com/privacy-scaling-explorations/maci.git && \
cd maci && \
git checkout v2.5.0 && \
pnpm i && \
pnpm run build
```

:::note
Unless you are looking to contribute to the MACI codebase, we suggest you use the latest released version. You can check all the releases [here](https://github.com/privacy-scaling-explorations/maci/releases).
:::

### Download the zero knowledge artifacts

MACI has two main zk-SNARK circuits, and each of them is parameterized. There should be one `.zkey` file for each circuit and set of parameters.

Unless you wish to generate a fresh set of `.zkey` files, you should obtain
them from someone who has performed a multi-party trusted setup for said
circuits. For more details on which artifacts have undergone a trusted setup, please refer to the [Trusted Setup](/docs/security/trusted-setup) page.

:::important
Note the locations of the `.zkey` files cause you will need it when deploying contracts. (put in the deploy-config.json)
:::

#### Download test artifacts

For all but production use cases, we suggest using the test artifacts, with the latest dev code, you can download them by running:

```bash
pnpm download-zkeys:test
```

#### Download ceremony artifacts

For production you need to use the ceremony artifacts which have undergone a trusted setup, you can download them with the command:

```bash
pnpm download-zkeys:ceremony
```

:::info
Currently, the ceremony artifacts work with MACI version up to 2.x
:::

## Deploy Contracts

Before deploying the contracts we need to do some final configurations to our repository.

### Set the environment variables

Head to the `packages/contracts` folder and copy the `.env.example` file.

```bash
cd packages/contracts && \
cp .env.example .env
```

Make sure to include a mnemonic and RPC url (make sure to replace NETWORK with the network you want to use).

```js
MNEMONIC = "your ethereum secret key";
NETWORK_RPC_URL = "the eth provider url";
NETWORK_ETHERSCAN_API_KEY = "etherscan api key";
```

### Generate Coordinator Keys

In order to run MACI polls, a coordinator is required to publish their MACI public key. You will need to generate a MACI keypair, and treat the private key just as your ethereum private keys. Please store them in a safe place as you won't be able to finish a round if you lose access, or if compromised a bad actor could decrypt the vote and publish them online. You can generate a new key pair using maci-cli by running the following commands:

```bash
cd packages/cli && \
node build/ts/index.js genMaciKeyPair
```

### Set the configuration file

:::note
There are already some deployed contracts that could be reused. More information can be found in the (incremental documentation page)[docs/getting-started#deploy-maci-contracts].
:::

Head back to the contracts folder and copy the config example and update the fields as necessary:

```bash
cd ../contracts && \
cp deploy-config-example.json deploy-config.json
```

#### ConstantInitialVoiceCreditProxy

Defines how many credits will get each voter.

#### Gatekeeper

MACI uses a "gatekeeper" contract to configure and enforce the eligibility criteria of voters who can participate in MACI polls. In other words, it is a way to allowlist signups to the system to protect against sybil attacks. Please refer to the [gatekeeper page in the documentation](/docs/technical-references/smart-contracts/Gatekeepers) for more information on the supported Gatekeepers.

:::important
For testing we suggest using the **FreeForAllGatekeeper** as it allows anyone to signup on MACI.
:::

#### MACI

This property defines which Gatekeeper and stateTreeDepth MACI is going to use. The stateTreeDepth defines how many users the system supports.

:::important
The stateTreeDepth value for test artifacts is: **10**. For ceremony keys: **14**.
:::

#### VkRegistry

The VkRegistry hold the verifying keys used to verify the proofs, on the zkeys field we define the path to the zero knowledge artifacts we downloaded in the previous steps.

:::important
The values for test keys are: **10-1-2-2-1**. For ceremony keys: **14-5-9-3-2**.
:::

#### Poll

Configures the poll duration in seconds, determines whether quadratic voting is enabled, and sets the public key of the Coordinator.

### Deploy MACI Contracts

To deploy the MACI contracts to a specific network you can append `:network` to the deployment commands, e.g. `pnpm deploy:sepolia` - please refer to the [supported networks](/docs/supported-networks/) documentation page to see all available networks.

```bash
pnpm deploy:NETWORK
```

## Deploy Poll

Before deploying a Poll, make sure you have set the coordinator MACI public key to which you own the private key. To deploy your first Poll you can run the following command:

```sh
pnpm deploy-poll:NETWORK
```

:::important
Starting another poll doesn't require deploying MACI contracts again, you can run `pnpm deploy-poll:NETWORK` command and then use the new poll-id.
:::

## Poll Finalization

As a coordinator, first you need to merge signups and messages (votes). Messages are stored in a queue so when the poll is over, the coordinator needs to create the merkle tree from the queue ([AccQueue](/docs/v2.x/core-concepts/merkle-trees#accumulator-queue)). This optimization is needed to reduce gas cost for voters. Then the coordinator generates proofs for the message processing, and tally calculations. This allows to publish the poll results on-chain and then everyone can verify the results when the poll is over. You run a merge with:

```bash
pnpm merge:[network] --poll [poll-id]
```

Then you need to generate the proofs with the following command:

```bash
pnpm run prove:[network] --poll [poll-id] \
    --coordinator-private-key [coordinator-maci-private-key] \
    --tally-file ../proofs/tally.json \
    --output-dir ../proofs/proofs/ \
    --start-block [block-number]  \
    --blocks-per-batch [number-of-blocks]
```

:::important
You can reduce the time of the proving by including more blocks per batch, you can try with 500.
:::

#### Submit On-chain

Now it's time to submit the poll results on-chain so that everyone can verify the results:

```bash
pnpm submitOnChain:[network] --poll [poll-id] \
    --output-dir proofs/ \
    --tally-file proofs/tally.json
```

#### Tally

Once the proofs are generated, and results tallied, the results (Tally) are written to a file. Let's take a look at one:

```json
{
  "maci": "0xd54b47F8e6A1b97F3A84f63c867286272b273b7C",
  "pollId": "0",
  "network": "localhost",
  "chainId": "31337",
  "isQuadratic": true,
  "tallyAddress": "0xD4fbAF1dFe100d07f8Ef73d8c92e93d0Bcf7b45D",
  "newTallyCommitment": "0x2f55cc85f7f141098ba791a9f6a646f8773b9bb4f5852ccc33b5a28e7b0756e5",
  "results": {
    "tally": [
      "9",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0"
    ],
    "salt": "0x2e9cd240b86cf456fa4deced8e7420c45e3c16941d2dcec308f8b6d48264dda3",
    "commitment": "0x296eac2a7289974f23497bebd39e86599d0b7032796fb84dcc1f6bbda38262ca"
  },
  "totalSpentVoiceCredits": {
    "spent": "81",
    "salt": "0x24f57b75c227987727c13d1e83409d70478b42bdc12a4a4df8129c72fbaf5aaf",
    "commitment": "0xb4ebe68b0da828c0b978ddee86ba934b8e215499ac766491f236ad85fd606de"
  },
  "perVOSpentVoiceCredits": {
    "tally": [
      "81",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0"
    ],
    "salt": "0x2590434ea2d600f7bd2396ba7fa454ad4c975c29424ee481561d9786538a5e48",
    "commitment": "0x54ec996599886da21c4b07c25d1de544292a8b7c38b79726995c869c9e95db"
  }
}
```

We observe an array named results, which holds the aggregated votes for each option. Each option corresponds to an index in the array. In the example above, the first option (index 0) received a total of 9 votes, while all other options received no votes

The `totalSpentVoiceCredits` object contains the total amount of voice credits spent in the poll. This is the sum of all voice credits spent by all voters, and in quadratic voting, is the sum of the squares of all votes.

The `perVOSpentVoiceCredits` will contain the amount of voice credits spent per vote option. In this case, the first option received 81 voice credits, and every other option received 0 voice credits. This is because there was only one valid vote casted, with a weight of 9. Given the quadratic voting formula, the total amount of voice credits spent is 81.

---

That should be all for this tutorial, feel free to join [our discord](https://discord.gg/pse) for any questions or recommendations, and feel free to read [our documentation](https://maci.pse.dev/docs/introduction) for more in depth resources.
