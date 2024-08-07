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

### Coordinator Key

Before deploying a Poll, make sure you have set the coordinator public to which you own the private key. You can generate a new one using `maci-cli` by running the following commands inside MACI's repo:

```bash
cd packages/cli && \
node build/ts/index.js genMaciKeyPair
```

Make sure you store this safely.

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

:::info
The `stateTreeDepth` parameter (further explained in the [circuits page](/docs/developers-references/zk-snark-circuits/setup#parameters)) is set to 10 by default, which supports 2 \*\* 10 users. If you want to change this, you can do so by editing the `deploy-config.json` file.
:::

3. Fill the `.env` file with the appropriate data (you will find an example in the `.env.example` file):
   - your mnemonic
   - an RPC key

:::info
The MACI repo comes with a `default-deployed-contracts.json` file containing contract addresses for the latest deployments on several l2 testnets. If you do not wish to re-deploy contracts, you can use those, you will need to copy the file to `deployed-contracts.json` using `cp default-deployed-contracts.json deployed-contracts.json`. On the other hand, if you want to make some changes to the configuration such changing the number of credits available to users for voting, you can delete the `ConstantInitialVoiceCreditProxy` address from the file as well as the `MACI` address, and running `pnpm deploy:$NETWORK --incremental` will only deploy those two contracts. Please ensure you have changed the required data in the `deploy-config.json` file too. This applies to all other changes you might require, like for instance changing the `stateTreeDepth` to accept less or more users, or the `gatekeeper` for different gating mechanisms.
:::

4. Run `pnpm deploy` (use `--incremental` if you are re-using contracts from `deployed-contracts.json`) to deploy the contracts (you can specify the network by appending `:network` to the command, e.g. `pnpm deploy:sepolia` - please refer to the available networks on the `package.json` scripts section)

The network options are: **_localhost, optimism, arbitrum, scroll, sepolia, optimism-sepolia, arbitrum-sepolia and scroll-sepolia_**, and the tasks flags and parameters are as follows:

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

#### Example - Deploying on OptimismSepolia with a different voice credit balance and gating mechanism

1. Ensure we have `.env` setup and monorepo installed and built.
2. Copy `default-deployed-contracts.json` to `deployed-contracts.json` remove the `ConstantInitialVoiceCreditProxy`, `FreeForAllGatekeeper` and `MACI` addresseses.

```json
  "optimism_sepolia": {
    "instance": {
      "0xa4fF6765C207C84AbeFCe0226b24204f9ceBAB45": {
        "id": "FreeForAllGatekeeper",
        "deploymentTxHash": "0x7fa84fe66edeb0f6d13999344289d0404eac443e52dab4c9b25d7415ff84e45b",
        "verify": {
          "args": "[]"
        }
      },
      "0xB1abb44291ff487f96636758b07Ccd9881f64c9A": {
        "id": "Verifier",
        "deploymentTxHash": "0x50377144a799369d26cb0f4de471a9c95a3b7de0a3aed18363cb1204ee45213a",
        "verify": {
          "args": "[]"
        }
      },
      "0x07490eba00dc4ACA6721D052Fa4C5002Aa077233": {
        "id": "PoseidonT3",
        "deploymentTxHash": "0x799a38ec8dfa740286f496da91d3549cfc923aa8f7c32cf0af2e03829ddb105f",
        "verify": {
          "args": "[]"
        }
      },
      "0xbb0e724CE02e5E7eDd31e632dc6e59F229a1126d": {
        "id": "PoseidonT4",
        "deploymentTxHash": "0x82e8dedbfd9a583b7b09d5e3d7a0b14d0b7a5062438ab70d3154d15f888ef960",
        "verify": {
          "args": "[]"
        }
      },
      "0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679": {
        "id": "PoseidonT5",
        "deploymentTxHash": "0xd57d72b7d519b81bd80b01c0b80669fb4c14b3b349b3d5555e7007ec0adae68d",
        "verify": {
          "args": "[]"
        }
      },
      "0xfD77833F10a29c76A6a0ede235Eb651D744d0E2F": {
        "id": "PoseidonT6",
        "deploymentTxHash": "0xb37f2be891314378b5f8579ba5bd95df7b0f1652b4f91356ddeb9e86ea7311fe",
        "verify": {
          "args": "[]"
        }
      },
      "0xad844a9567ada5996FFC0D2DeC78b3767a1c0501": {
        "id": "PollFactory",
        "deploymentTxHash": "0x99a4dd853297e4aa9a824c509268926875f9ec2971b6c6e74b3179fd4f8845ca",
        "verify": {
          "args": "[]"
        }
      },
      "0xbBb6f1B4232F993e5a026217a3D596B332062CB3": {
        "id": "MessageProcessorFactory",
        "deploymentTxHash": "0xe817a6c240bdbb19a974f9a36eed9fd89794229496ed51db591b23382910bbb2",
        "verify": {
          "args": "[]"
        }
      },
      "0x1356f05179cdcAD2D8708B539A75de082118de92": {
        "id": "TallyFactory",
        "deploymentTxHash": "0x7b57994dccdbeeff25d9f7f58fde0f35cd10ce53eb160009c565033a370a0600",
        "verify": {
          "args": "[]"
        }
      },
      "0x42B1AB3d98B8235204E75112e5d9E974cE7531cC": {
        "id": "VkRegistry",
        "deploymentTxHash": "0x1b05a22de2735ed74b58532303e7af01659b066206e696f4c8e6df61bc97f442",
        "verify": {
          "args": "[]"
        }
      }
    },
     "named": {
      "Verifier": {
        "address": "0xB1abb44291ff487f96636758b07Ccd9881f64c9A",
        "count": 1
      },
      "PoseidonT3": {
        "address": "0x07490eba00dc4ACA6721D052Fa4C5002Aa077233",
        "count": 1
      },
      "PoseidonT4": {
        "address": "0xbb0e724CE02e5E7eDd31e632dc6e59F229a1126d",
        "count": 1
      },
      "PoseidonT5": {
        "address": "0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679",
        "count": 1
      },
      "PoseidonT6": {
        "address": "0xfD77833F10a29c76A6a0ede235Eb651D744d0E2F",
        "count": 1
      },
      "PollFactory": {
        "address": "0xad844a9567ada5996FFC0D2DeC78b3767a1c0501",
        "count": 1
      },
      "MessageProcessorFactory": {
        "address": "0xbBb6f1B4232F993e5a026217a3D596B332062CB3",
        "count": 1
      },
      "TallyFactory": {
        "address": "0x1356f05179cdcAD2D8708B539A75de082118de92",
        "count": 1
      },
      "VkRegistry": {
        "address": "0x42B1AB3d98B8235204E75112e5d9E974cE7531cC",
        "count": 1
      }
    }
```

3. Change the required data inside the `deploy-config.json` file

:::info
You can see we changed `ConstantInitialVoiceCreditProxy.amount` to 150, `FreeForAllGatekeeper.deploy` to false, `EASGatekeeper.deploy` to true and `MACI.gatekeeper` to `EASGatekeeper`.
:::

```json
    "optimism_sepolia": {
      "ConstantInitialVoiceCreditProxy": {
        "deploy": true,
        "amount": 150
      },
      "FreeForAllGatekeeper": {
        "deploy": false
      },
      "EASGatekeeper": {
        "deploy": true,
        "easAddress": "0x4200000000000000000000000000000000000021",
        "schema": "0xe2636f31239f7948afdd9a9c477048b7fc2a089c347af60e3aa1251e5bf63e5c",
        "attester": "0xcBc8a82E3dfc6Faa2506F3033271EBc7447f096B"
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
        "coordinatorPubkey": "macipk.9a59264310d95cfd8eb7083aebeba221b5c26e77427f12b7c0f50bc1cc35e621",
        "useQuadraticVoting": false
      }
    }
```

4. Deploy: `pnpm deploy:optimism-sepolia --incremental`
5. Verify: `pnpm verify:optimism-sepolia`
6. Deploy a poll: `pnpm deploy-poll:optimism-sepolia`

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
