---
title: Integrating MACI
description: How to integrate MACI into your application
sidebar_label: Integrating
sidebar_position: 11
---

# Integrating MACI

MACI can be used in any protocol that requires collusion resistance, for instance it has been proven to be quite efficient when integrated in quadratic funding applications such as [clr.fund](https://github.com/clrfund/monorepo) and [qfi](https://github.com/quadratic-funding/qfi/tree/feat/code-freeze).

Here we will be looking at QFI and how it was used. Please note that this will be expanded as QFI is updated to use the newest version of MACI. Should you decide to integrate MACI in the meantime, feel free to open an issue on the GitHub repo.

## Deployment

First, you need to deploy contracts to start using MACI. This can be easily done via `maci-cli`.
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
10. Deploy Poll, AccQueueQuinaryMaci, MessageProcessor, Tally and Susbsidy (optional)

Before running the deploy command make sure you have [zkey files](https://maci.pse.dev/docs/trusted-setup) from trusted setup and env variables `ETH_PROVIDER` (RPC endpoint) and `ETH_SK` (wallet private key) are set. For production environment make sure you don't use zkey files from our examples.

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
maci-cli create --stateTreeDepth 10
maci-cli deployPoll \
    --pubkey coordinator-public-key \
    --duration 30 \
    --max-messages 25 \
    --max-vote-options 25 \
    --int-state-tree-depth 1 \
    --msg-tree-depth 2 \
    --msg-batch-depth 1 \
    --vote-option-tree-depth 2 \
    --subsidy-enabled false
```

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

As a coordinator, first you need to merge signups and messages (votes). Signups and messages are stored in a queue so when the poll in over, the coordinator needs to create the tree from the queue. This optimization is needed to reduce gas cost for voters. Then coordinator generates proofs for the message processing, tally and subsidy calculations. This allows to publish the poll results on-chain and then everyone can verify the results when the poll is over.

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
    --subsidy-enabled false
maci-cli verify \
    --poll-id 0 \
    --subsidy-enabled false \
    --tally-file tally.json # this file is generated in genProofs
```

When poll finishes, [Tally contract](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/Tally.sol) emits the event with poll address so you can track the state changes.

```javascript
event BallotsTallied(address poll);
```

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

## Subsidy

It's also possible to use subsidy feature when coordinator deploys polls, proves poll results on-chain and when poll results are verified. This contract is used to verify that the subsidy calculations are correct. It is also used to update the subsidy commitment if the proof is valid. To enable this feature just provide `--subsidy-enabled` or `-se` for `maci-cli` commands (`deployPoll`, `proveOnChain`, `verify`).

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
