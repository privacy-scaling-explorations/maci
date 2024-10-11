---
title: Getting Started
description: Getting with MACI
sidebar_label: Getting Started
sidebar_position: 2
---

# Getting Started

## Requirements

You need the following to use MACI:

- Node.js: use a JS toolchain manager like [`nvm`](https://github.com/nvm-sh/nvm) or [`volta`](https://volta.sh/) to install Node.js. We recommend using Node 20 or above.
- [pnpm](https://pnpm.io/installation): Fast, disk space efficient package manager.

## Installation

To install MACI you need to run the following commands:

```bash
git clone https://github.com/privacy-scaling-explorations/maci.git && \
cd maci && \
git checkout v2.4.0 && \
pnpm i && \
pnpm run build
```

:::note
We suggest you use the latest released version. You can verify the [latest here](https://github.com/privacy-scaling-explorations/maci/releases).
:::

#### Decide whether you need to compile new circuits or use the test ones

If you are going to be making any changes to the circom circuits, then you can follow the [compile circuits guide](./guides/compile-circuits.md) and skip the next section.

### Download the `.zkey` files

MACI has two main zk-SNARK circuits. Each circuit is parameterised. There should be one
`.zkey` file for each circuit and set of parameters.

Unless you wish to generate a fresh set of `.zkey` files, you should obtain
them from someone who has performed a multi-party trusted setup for said
circuits. For more details on which artifacts have undergone a trusted setup, please refer to the [Trusted Setup](/docs/security/trusted-setup) page.

:::important
Note the locations of the `.zkey` files as the CLI requires them as command-line flags.
:::

#### Download test artifacts

For quickly testing MACI or trying it on a testnet we suggest using the test artifacts, using the latest dev updates you can do it by running:

```bash
pnpm download-zkeys:test
```

#### Download ceremony artifacts

For production you need to use the ceremony artifacts which have undergone a trusted setup, you can download it with the command:

```bash
pnpm download-zkeys:ceremony
```

:::info
Currently, the ceremony artifacts work with MACI version up to 2.x
:::

## Deploy Contracts

### Set the .env

Head to the `packages/contracts` folder and copy the `.env.example` file.

```bash
cd packages/contracts && \
cp .env.example .env
```

Make sure to include a mnemonic and RPC url (make sure to replace NETWORK with the network you want to use).

```js
MNEMONIC = "your_ethereum_secret_key";
{
  NETWORK;
}
_RPC_URL = "the_eth_provider_url";
{
  NETWORK;
}
_ETHERSCAN_API_KEY = "etherscan api key";
```

### Generate Coordinator Keys

Before deploying a Poll, make sure you have set the coordinator public to which you own the private key. You can generate a new one using maci-cli by running the following commands:

```bash
cd packages/cli && \
node build/ts/index.js genMaciKeyPair
```

### Set the configuration file

Head back to the contracts folder and copy the config example and update the fields as necessary:

```bash
cd ../contracts && \
cp deploy-config-example.json deploy-config.json

```

#### ConstantInitialVoiceCreditProxy

Defines how many credits will get each voter.

| Property   | Description                                              |
| ---------- | -------------------------------------------------------- |
| **deploy** | Defines if the contract is needs to be deployed.         |
| **amount** | Defines how many vote credits will get each participant. |

:::important
The current deployed contract has **99** as the voice credits amount.
:::

#### Gatekeeper

MACI uses a "gatekeeper" contract to configure and enforce the eligibility criteria of voters who can participate in MACI polls. In other words, it is a way to allowlist signups to the system. Operators of MACI can use the gatekeeper contract to configure signup eligibility and to protect against sybil attacks in their polls. Please refer to the [gatekeepers section](/docs/technical-references/smart-contracts/Gatekeepers) for more information on the supported Gatekeepers.

| Property   | Description                                      |
| ---------- | ------------------------------------------------ |
| **deploy** | Defines if the contract is going to be deployed. |

:::important
For testing we suggest using the **FreeForAllGatekeeper**.
:::

#### MACI

| Property           | Description                                 |
| ------------------ | ------------------------------------------- |
| **stateTreeDepth** | Defines how many users the system supports. |
| **gatekeeper**     | Defines which gatekeeper will use.          |

#### VkRegistry

Verifying key registry used for generating proofs.

| Property                | Description                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| **stateTreeDepth**      | Defines how many users the system supports.                                    |
| **intStateTreeDepth**   | Defines how many ballots can be processed per batch when tallying the results. |
| **messageTreeDepth**    | Defines how many messages (votes) the system supports.                         |
| **voteOptionTreeDepth** | Defines how many vote options the system supports.                             |
| **messageBatchDepth**   | Defines how many messages in a batch can the circuit process.                  |
| **zkeys**               | Defines the path to the zkey files for QV and Non QV keys.                     |

:::important
The recommended values for test keys are: **10-1-2-2-1**. For ceremony keys: **14-5-9-3-2**.
:::

#### Poll

| Property               | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| **pollDuration**       | Defines how long is going to be the poll in seconds. |
| **coordinatorPubkey**  | Defines the coordinator public MACI key.             |
| **useQuadraticVoting** | Defines if the poll uses quadratic voting or not.    |

### Deploy MACI Contracts

To deploy the MACI contracts to a specific network you can append `:network` to the deployment commands, e.g. `pnpm deploy:sepolia` - please refer to the available networks on the package.json scripts section.

```bash
pnpm deploy:NETWORK
```

There are already some deployed contracts that could be reused, copy the `default-deployed-contracts.json` file if you need them to avoid deploying redundant contracts and save your gas fee.

```bash
cp default-deployed-contracts.json deployed-contracts.json
```

Delete any contract you want to redeploy and then run the following command to save gas:

```bash
pnpm deploy:NETWORK --incremental
```

### Deploy Poll

To deploy your first Poll you can run the following command:

```sh
pnpm deploy-poll:NETWORK
```

:::important
Making another poll doesn't require deploying MACI contracts again, you can deploy another poll running the `pnpm deploy-poll:NETWORK` command and then use the updated poll-id.
:::

## Poll Finalization

As a coordinator, first you need to merge signups and messages (votes). Messages are stored in a queue so when the poll is over, the coordinator needs to create the tree from the queue ([AccQueue](/docs/core-concepts/merkle-trees#accumulator-queue)). This optimization is needed to reduce gas cost for voters. Then coordinator generates proofs for the message processing, and tally calculations. This allows to publish the poll results on-chain and then everyone can verify the results when the poll is over. You run a merge with:

```bash
pnpm merge:[network] --poll [poll-id]
```

Then you need to generate the proofs for the message processing, and tally calculations. This allows to publish the poll results on-chain and then everyone can verify the results:

```bash
pnpm run prove:[network] --poll [poll-id] \
    --coordinator-private-key [coordinator-maci-private-key] \
    --tally-file ../results/tally.json \
    --output-dir ../results/proofs/ \
    --start-block [block-number]
```

:::important
We suggest including the --start-block flag, proving requires fetching all events from the smart contracts and by default starts from block zero, this would take a lot of time and is error-prone due to RPC provider limitations.
:::

### Tally

After proofs are generated, and results tallied, the results (Tally) is written to a file. This file contains the result of a Poll. Let's take a look at one:

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

We see that there is an array named results, this contains the aggregated votes for each option, where each option is represented by an index in the array. In this case above, the first option (index 0) received a total of 9 votes, where every other option did not receive any votes.

The `totalSpentVoiceCredits` object contains the total amount of voice credits spent in the poll. This is the sum of all voice credits spent by all voters, and in quadratic voting, is the sum of the squares of all votes.

The `perVOSpentVoiceCredits` will contain the amount of voice credits spent per vote option. In this case, the first option received 81 voice credits, and every other option received 0 voice credits. This is because there was only one valid vote casted, with a weight of 9. Given the quadratic voting formula, the total amount of voice credits spent is 81.
