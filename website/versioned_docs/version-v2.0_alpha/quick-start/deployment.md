---
title: Deployment
description: MACI Smart Contracts deployment
sidebar_label: Deployment
sidebar_position: 3
---

Currently, it is possible to deploy MACI contracts in two ways:

- using the hardhat tasks inside the `maci-contracts` package
- using the cli (`maci-cli`)

:::info
We recommend to use the hardhat tasks inside the `maci-contracts` folder, due to their simplicity and customizability.
:::

## Deployment Steps

:::info
Before deploying the contracts, please ensure that you have compiled the project using the correct state tree depth argument. This defines the maximum number of users that the system supports, and by default the parameter is set to 10 (to support 2 \*\* 10 users) for testing purposes. For production use, you might need to change this parameter to a different value. For more information about the parameters please refer to the [circuits page](/docs/developers-references/zk-snark-circuits/setup#parameters).

To re-compile with a different state tree depth parameter please run:

`export STATE_TREE_DEPTH=$ENTER_VALUE_HERE && pnpm build`
:::

In order, these are the steps for a full MACI deployment:

1. Deploy crypto (Hasher, Poseidon)
2. Deploy VK Registry
3. Set verification keys
4. Deploy VoiceCreditProxy
5. Deploy Gatekeeper
6. Deploy Verifier
7. Deploy MessageProcessorFactory, PollFactory, TallyFactory
8. Deploy MACI
9. Deploy Poll, AccQueueQuinaryMaci, MessageProcessor and Tally

### Note on ZKey artifacts

For testing purposes, you can use the test zkeys and artifacts that you can download using `pnpm download:test-zkeys`. For production use, you can download the most recent artifacts that have undergone a trusted setup. Please refer to the [Trusted Setup](/docs/security/trusted-setup) section for more information. To download those, please use `pnpm download:ceremony-zkeys`.

Please do not use test artifacts in production. If you do require zKeys configured for larger param sizes, please reach out to us if you will be using them in production and we'll discuss running a new ceremony for those parameters. To build new circuits artifacts for testing purposes, please refer to the [installation page](/docs/quick-start/installation#configure-circomkit) and to the [circuits](/docs/developers-references/zk-snark-circuits/introduction) section.

### Note on Gatekeepers

MACI uses a "gatekeeper" contract to configure and enforce the eligibility criteria of voters who can participate in MACI polls. In other words, it is a way to allowlist signups to the system. Operators of MACI can use the gatekeeper contract to configure signup eligibility and to protect against sybil attacks in their polls.

It's necessary to define which gatekeeper you are going to use before deploying, please refer to the [gatekeepers section](/docs/developers-references/smart-contracts/Gatekeepers) for more information on the supported Gatekeepers.

### Deployment using `maci-contracts` hardhat tasks

1. Take the `deploy-config-example.json` file and copy it over to `deploy-config.json`
2. Update the fields as necessary:

```json
{
  "localhost": {
    "ConstantInitialVoiceCreditProxy": {
      "deploy": true,
      "amount": 99
    },
    "FreeForAllGatekeeper": {
      "deploy": false
    },
    "EASGatekeeper": {
      "deploy": true,
      "easAddress": "0x4200000000000000000000000000000000000021",
      "schema": "0xe2636f31239f7948afdd9a9c477048b7fc2a089c347af60e3aa1251e5bf63e5c",
      "attester": "0xcbc8a82e3dfc6faa2506f3033271ebc7447f096b"
    },
    "GitcoinPassportGatekeeper": {
      "deploy": false,
      "decoderAddress": "0xe53C60F8069C2f0c3a84F9B3DB5cf56f3100ba56",
      "passingScore": 5
    },
    "ZupassGatekeeper": {
      "deploy": false,
      "signer1": "13908133709081944902758389525983124100292637002438232157513257158004852609027",
      "signer2": "7654374482676219729919246464135900991450848628968334062174564799457623790084",
      "eventId": "69c0caaa-c65d-5345-a20c-867774f18c67",
      "zupassVerifier": "0x2272cdb3596617886d0F48524DA486044E0376d6"
    },
    "SemaphoreGatekeeper": {
      "deploy": false,
      "semaphoreContract": "0x0000000000000000000000000000000000000000",
      "groupId": 0
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
      "zkeys": {
        "qv": {
          "processMessagesZkey": "../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey",
          "tallyVotesZkey": "../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey",
          "processWasm": "../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm",
          "tallyWasm": "../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm"
        },
        "nonQv": {
          "processMessagesZkey": "../cli/zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test.0.zkey",
          "tallyVotesZkey": "../cli/zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey",
          "processWasm": "../cli/zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_js/ProcessMessagesNonQv_10-2-1-2_test.wasm",
          "tallyWasm": "../cli/zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_js/TallyVotesNonQv_10-1-2_test.wasm"
        }
      }
    },
    "Poll": {
      "pollDuration": 3600,
      "coordinatorPubkey": "macipk.0a1ce79a43fa676ee3d2882c79d9164a24d4a22bb6190e3d8fa25d97bffc069a",
      "useQuadraticVoting": false
    }
  }
}
```

3. Fill the `.env` file with the appropriate data (you will find an example in the `.env.example` file):
   - your mnemonic
   - an RPC key
4. Run `pnpm deploy` to deploy the contracts (you can specify the network by appending `:network` to the command, e.g. `pnpm deploy:sepolia` - please refer to the available networks on the `package.json` scripts section)

The network options are: **_localhost, sepolia, and optimism-sepolia_**, and the tasks flags and parameters are as follows:

| Command     | Flags                                                                                                                     | Options                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| deploy      | `--incremental`: incremental deployment <br/> `--strict`: fail on warning <br/> `--verify`: verify contracts on Etherscan | `--skip <index>`: Skip steps with less or equal index |
| deploy-poll | `--incremental`: incremental deployment <br/> `--strict`: fail on warning <br/> `--verify`: verify contracts on Etherscan | `--skip <index>`: Skip steps with less or equal index |

5. Run `pnpm deploy-poll` to deploy your first Poll (you can specify the network by appending `:network` to the command, e.g. `pnpm deploy-poll:sepolia` - please refer to the available networks on the `package.json` scripts section)

:::info
Should you wish to deploy on a different network, you will need to update the [contracts/tasks/helpers/constants.ts](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/tasks/helpers/constants.ts) file.
:::

6. You will find all of the deployed contracts addresses and configs in the `deployed-contracts.json` file inside the contracts folder.

:::info
You can find more information on integration and usage in the [Integrating MACI](/docs/developers-references/integrating) section.
:::

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
    --tally-votes-zkey ./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey \
    --useQuadraticVoting true
maci-cli create --stateTreeDepth 10
maci-cli deployPoll \
    --pubkey coordinator-public-key \
    --duration 300 \
    --int-state-tree-depth 1 \
    --msg-tree-depth 2 \
    --msg-batch-depth 1 \
    --vote-option-tree-depth 2 \
    --useQuadraticVoting true
```

:::info
For quadratic voting polls, you can use the `--use-quadratic-voting true` flag when deploying a Poll.
For non-quadratic voting polls, you can use the `--use-quadratic-voting false` flag when deploying a Poll.
:::
