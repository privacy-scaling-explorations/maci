---
title: Integrating MACI
description: How to integrate MACI into your application
sidebar_label: Integrating
sidebar_position: 13
---

# Integrating MACI

MACI can be used in any protocol that requires collusion resistance, for instance it has been proven to be quite efficient when integrated in quadratic funding applications such as [clr.fund](https://github.com/clrfund/monorepo) and [qfi](https://github.com/quadratic-funding/qfi/tree/feat/code-freeze).

Here we will be looking at QFI and how it was used. Please note that this will be expanded as QFI is updated to use the newest version of MACI. Should you decide to integrate MACI in the meantime, feel free to open an issue on the GitHub repo.

## Deployment

First, you need to deploy contracts to start using MACI. This could be done through either `maci-cli` or by using hardhat tasks in the `contracts` folder.

### Via `maci-cli`

This can be easily done via [`maci-cli`](/docs/cli#subcommands).
Deployment order is:

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

Before running the deploy command make sure you have [zkey files](https://maci.pse.dev/docs/trusted-setup) from trusted setup and env variables `ETH_PROVIDER` (RPC endpoint) and `ETH_SK` (wallet private key) are set. For production environment make sure you don't use zkey files from our examples.

:::note Non Quadratic Voting

Make sure that if you intend to run a non quadratic voting Poll, you set the **NonQv** zKey files on the VkRegistry contract, as well as deploy the Poll with the option `--use-quadratic-voting false`. Finally, remember to use the correct zk-SNARK artifacts (zKeys, and witnesses) in the genProof/prove commands.

:::

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
    --duration 30 \
    --int-state-tree-depth 1 \
    --msg-tree-depth 2 \
    --msg-batch-depth 1 \
    --vote-option-tree-depth 2
```

### Deploy contracts in `maci/contracts`

This could also be done via running commands in `maci/contracts`. Please download the maci repository, install and build everything, then navigate to the `contracts` folder.

First of all, modify the `deploy-config.json` file:

```
{
  "choose-a-network": {
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
      "zkeys": {
        "qv": {
          "processMessagesZkey": "../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey",
          "tallyVotesZkey": "../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey"
        },
        "nonQv": {
          "processMessagesZkey": "../cli/zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test.0.zkey",
          "tallyVotesZkey": "../cli/zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey"
        }
      }
    },
    "Poll": {
      "pollDuration": 30,
      "coordinatorPubkey": "macipk.9a59264310d95cfd8eb7083aebeba221b5c26e77427f12b7c0f50bc1cc35e621",
      "useQuadraticVoting": true
    }
  }
}
```

and run the following command:

```
pnpm run deploy:[network]
pnpm run deploy-poll:[network]
```

The network options are: **_localhost, sepolia, and optimism-sepolia_**, and the tasks flags and parameters are as follows:

| Command     | Flags                                                                                                                     | Options                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| deploy      | `--incremental`: incremental deployment <br/> `--strict`: fail on warning <br/> `--verify`: verify contracts on Etherscan | `--skip <index>`: Skip steps with less or equal index |
| deploy-poll | `--incremental`: incremental deployment <br/> `--strict`: fail on warning <br/> `--verify`: verify contracts on Etherscan | `--skip <index>`: Skip steps with less or equal index |

## Signups and votes

Next, you can start accept user signup and votes. This can be done via `maci-cli` as well:

```bash
maci-cli signup \
    --pubkey user-public-key
maci-cli publish \
    --pubkey user-public-key \
    --privkey user-private-key \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id 0
```

## Poll finalization

As a coordinator, first you need to merge signups and messages (votes). Signups and messages are stored in a queue so when the poll in over, the coordinator needs to create the tree from the queue. This optimization is needed to reduce gas cost for voters. Then coordinator generates proofs for the message processing, and tally calculations. This allows to publish the poll results on-chain and then everyone can verify the results when the poll is over.

This could also be done by `maci-cli` or run commands in `contracts` folder.

### Via `maci-cli`

```bash
maci-cli mergeSignups --poll-id 0
maci-cli mergeMessages --poll-id 0
maci-cli genProofs \
    --privkey coordinator-private-key \
    --poll-id 0 \
    --process-zkey ./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-zkey ./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey \
    --tally-file tally.json \
    --output proofs/ \
    --tally-wasm ./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm \
    --process-wasm ./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm \
    --wasm
maci-cli proveOnChain \
    --poll-id 0 \
    --proof-dir proofs/ \
maci-cli verify \
    --poll-id 0 \
    --tally-file tally.json # this file is generated in genProofs
```

### Finalize in `maci/contracts`

```
pnpm merge:[network] --poll 0
pnpm run prove:[network] --poll 0 \
    --coordinator-private-key "macisk.1751146b59d32e3c0d7426de411218172428263f93b2fc4d981c036047a4d8c0" \
    --process-zkey ../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-zkey ../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey \
    --tally-file ../cli/tally.json \
    --output-dir ../cli/proofs/ \
    --tally-wasm ../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm \
    --process-wasm ../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm
```

The network options are: **_localhost, sepolia, and optimism-sepolia_**, and the tasks flags and parameters are as follows:

| Command | Flags                                                            | Options                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| merge   |                                                                  | `--poll <pollId>`: the poll id <br/> `--queue-ops <queueOps>`: The number of queue operations to perform <br/> `--prove <prove>`: Run prove command after merging or not                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| prove   | `--use-quadratic-voting`: Whether to use quadratic voting or not | `--poll <pollId>`: the poll id <br/> `--output-dir <outputDir>`: Output directory for proofs <br /> `--coordinator-private-key <coordinatorPrivateKey>`: Coordinator maci private key <br /> `--rapid-snark <rapidSnark>`: Rapidsnark binary path <br /> `--process-zkey <processKey>`: Process zkey file path <br /> `--process-witgen <processWitgen>`: Process witgen binary path <br /> `--process-wasm <processWasm>`: Process wasm file path <br /> `--tally-file <tallyFile>`: The file to store the tally proof <br /> `--tally-zkey <tallyZkey>`: Tally zkey file path <br /> `--tally-witgen <tallyWitgen>`: Tally witgen binary path <br /> `--tally-wasm <tallyWasm>`: Tally wasm file path <br /> `--state-file <stateFile>`: The file with the serialized maci state <br /> `--start-block <startBlock>`: The block number to start fetching logs from <br /> `--blocks-per-batch <blocksPerBatch>`: The number of blocks to fetch logs from <br /> `--end-block <endBlock>`: The block number to stop fetching logs from <br /> `--transaction-hash <transactionHash>`: The transaction hash of the first transaction |

## MACI Contract

The MACI contract is the core of the protocol. Contracts can inherit from MACI and thus expose the signup and topup functions. As with standalone MACI, one would need to deploy a [sign up gatekeeper](./contracts#signupgatekeeper) as well as the [voice credit proxy](./contracts#voicecreditproxy).

As an example, within the quadratic funding infrastructure project, the QFI contract inherits from MACI and allows sign up via the contribute function.

```javascript
function contribute(
    PubKey calldata pubKey,
    uint256 amount
    ) external {

    [..snip]

    uint256 voiceCredits = amount / voiceCreditFactor;
    // The user is marked as registered here upon contribution
    grantRoundToContributors[nextGrantRoundId][msg.sender] = ContributorStatus(voiceCredits, true);

    // Increase the number of contributors for this round
    grantRoundToContributorsCount[nextGrantRoundId]++;

    bytes memory signUpGatekeeperAndInitialVoiceCreditProxyData = abi.encode(
        msg.sender,
        voiceCredits
    );

    signUp(
        pubKey,
        signUpGatekeeperAndInitialVoiceCreditProxyData,
        signUpGatekeeperAndInitialVoiceCreditProxyData
    );

    [..snip]

    emit ContributionSent(msg.sender, amount);
}
```

## InitialVoiceCreditProxy

If you'd like to extend the functionality of how votes are distributed among users, you need to extend [InitialVoiceCreditProxy](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol) contract. You can see our [basic example](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/initialVoiceCreditProxy/ConstantInitialVoiceCreditProxy.sol) how it's implemented for constant distribution.

```javascript
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { InitialVoiceCreditProxy } from "./InitialVoiceCreditProxy.sol";

/// @title ConstantInitialVoiceCreditProxy
/// @notice This contract allows to set a constant initial voice credit balance
/// for MACI's voters.
contract ConstantInitialVoiceCreditProxy is InitialVoiceCreditProxy {
  /// @notice the balance to be returned by getVoiceCredits
  uint256 internal balance;

  /// @notice creates a new ConstantInitialVoiceCreditProxy
  /// @param _balance the balance to be returned by getVoiceCredits
  constructor(uint256 _balance) payable {
    balance = _balance;
  }

  /// @notice Returns the constant balance for any new MACI's voter
  /// @return balance
  function getVoiceCredits(address, bytes memory) public view override returns (uint256) {
    return balance;
  }
}
```

## Poll Contract

On the other hand, the Poll contract can be inherited to expose functionality such as top ups and publishing of messages/commands.

For instance, within QFI, the `publishMessageBatch` function call the `publishMessage` function of Poll, as shown below:

```javascript
function publishMessageBatch(
    Message[] calldata _messages,
    PubKey[] calldata _encPubKeys
) external {
    // Check that the two arrays have the same length
    require(
        _messages.length == _encPubKeys.length,
        "GrantRound: _messages and _encPubKeys should be the same length"
    );

    uint256 batchSize = _messages.length;
    for (uint8 i = 0; i < batchSize; ++i) {
        publishMessage(_messages[i], _encPubKeys[i]);
    }

    emit Voted(msg.sender);
}
```
