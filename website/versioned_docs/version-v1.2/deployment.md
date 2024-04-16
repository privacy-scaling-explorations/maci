---
title: MACI Deployment
description: MACI Smart Contracts deployment
sidebar_label: MACI deployment
sidebar_position: 24
---

# MACI Deployment

Currently, it is possible to deploy MACI contracts in two ways:

- using the cli (`maci-cli`)
- using the hardhat tasks inside the `maci-contracts` package

## MACI Deployment Steps

In order, these are the steps for contract deployment:

1. Deploy crypto (Hasher, Poseidon)
2. Deploy VK Registry
3. Set verification keys
4. Deploy VoiceCreditProxy
5. Deploy Gatekeeper
6. Deploy Verifier
7. Deploy Topup credit
8. Deploy MessageProcessorFactory, PollFactory, SubsidyFactory, TallyFactory
9. Deploy MACI, AccQueueQuinaryMaci
10. Deploy Poll, AccQueueQuinaryMaci, MessageProcessor, Tally and Subsidy (optional)

### Note on ZKey artifacts

For testing purposes, you can use the test zkeys and artifacts that you can download using `pnpm download:test-zkeys`. For production use, you can download the most recent artifacts that have undergone a trusted setup. Please refer to the [Trusted Setup](/docs/v1.2/trusted-setup) section for more information. To download those, please use `pnpm download:ceremony-zkeys`.

Please do not use test artifacts in production. If you do require zKeys configured for larger param sizes, please reach out to us if you will be using them in production and we'll discuss running a new ceremony for those parameters. To build new circuits artifacts for testing purposes, please refer to the [installation page](/docs/v1.2/installation/#configure-circomkit) and to the [circuits](/docs/v1.2/circuits) section.

### Deployment using `maci-cli`

```bash
maci-cli deployVkRegistry
maci-cli setVerifyingKeys \
    --state-tree-depth 10 \
    --int-state-tree-depth 1 \
    --msg-tree-depth 2 \
    --vote-option-tree-depth 2 \
    --msg-batch-depth 1 \
    --process-messages-zkey ./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-votes-zkey ./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey
maci-cli create --stateTreeDepth 10 --use-quadratic-voting true
maci-cli deployPoll \
    --pubkey coordinator-public-key \
    --duration 300 \
    --int-state-tree-depth 1 \
    --msg-tree-depth 2 \
    --msg-batch-depth 1 \
    --vote-option-tree-depth 2 \
    --subsidy-enabled false
```

:::info
For quadratic voting polls, you can use the `--use-quadratic-voting true` flag when creating the MACI instance.
For non-quadratic voting polls, you can use the `--use-quadratic-voting false` flag when creating the MACI instance.
:::

### Deployment using `maci-contracts` hardhat tasks

1. Take the `deploy-config-example.json` file and copy it over to `deploy-config.json`
2. Update the fields as necessary:

```json
{
  "sepolia": {
    "ConstantInitialVoiceCreditProxy": {
      "deploy": true,
      "amount": 99
    },
    "FreeForAllGatekeeper": {
      "deploy": false
    },
    "EASGatekeeper": {
      "deploy": true,
      "easAddress": "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
      "schema": "0xe2636f31239f7948afdd9a9c477048b7fc2a089c347af60e3aa1251e5bf63e5c",
      "attester": "attester-address"
    },
    "MACI": {
      "stateTreeDepth": 10,
      "gatekeeper": "EASGatekeeper"
    },
    "VkRegistry": {
      "stateTreeDepth": 10,
      "intStateTreeDepth": 1,
      "messageTreeDepth": 2,
      "voteOptionTreeDepth": 2,
      "messageBatchDepth": 1,
      "processMessagesZkey": "../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey",
      "tallyVotesZkey": "../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey"
    },
    "Poll": {
      "pollDuration": 30,
      "coordinatorPubkey": "macipk.ea638a3366ed91f2e955110888573861f7c0fc0bb5fb8b8dca9cd7a08d7d6b93",
      "subsidyEnabled": false,
      "useQuadraticVoting": true
    }
  }
}
```

3. Fill the `.env` file with the appropriate data (you will find an example in the `.env.example` file:
   - your mnemonic
   - an RPC key
4. Run `pnpm deploy` to deploy the contracts (you can specify the network by appending `:network` to the command, e.g. `pnpm deploy:sepolia` - please refer to the available networks on the `package.json` scripts section)
5. Run `pnpm deploy-poll` to deploy your first Poll (you can specify the network by appending `:network` to the command, e.g. `pnpm deploy-poll:sepolia` - please refer to the available networks on the `package.json` scripts section)

:::info
Should you wish to deploy on a different network, you will need to update the [contracts/tasks/helpers/constants.ts](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/tasks/helpers/constants.ts) file.
:::

6. You will find all of the deployed contracts addresses and configs in the `deployed-contracts.json` file inside the contracts folder.

:::info
You can find more information on integration and usage in the [Integrating MACI](/docs/v1.2/integrating) section.
:::
