---
title: VkRegistry Smart Contract
description: VkRegistry smart contract
sidebar_label: VkRegistry
sidebar_position: 8
---

:::info
Code location: [VkRegistry.sol](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/VkRegistry.sol)
:::

The VkRegistry is a contract that holds the verifying keys for the zk-SNARK circuits. It holds two different sets of keys:

- `processVks` - The keys for the processMessages circuit
- `tallyVks` - The keys for the tallyVotes circuit

Each circuit will have a signature which is its compile-time constants represented as a uint256.

Please note that each Verifying Key should be set with the corresponding mode. Available modes are quadratic voting and non quadratic voting.

The contract owner can set them using the `setVerifyingKeysBatch` function:

```ts
  function setVerifyingKeysBatch(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _messageTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint256 _messageBatchSize,
    Mode[] calldata _modes,
    VerifyingKey[] calldata _processVks,
    VerifyingKey[] calldata _tallyVks
  ) public onlyOwner {
    if (_modes.length != _processVks.length || _modes.length != _tallyVks.length) {
      revert InvalidKeysParams();
    }

    uint256 length = _modes.length;

    for (uint256 index = 0; index < length; ) {
      setVerifyingKeys(
        _stateTreeDepth,
        _intStateTreeDepth,
        _messageTreeDepth,
        _voteOptionTreeDepth,
        _messageBatchSize,
        _modes[index],
        _processVks[index],
        _tallyVks[index]
      );

      unchecked {
        index++;
      }
    }
  }
```
