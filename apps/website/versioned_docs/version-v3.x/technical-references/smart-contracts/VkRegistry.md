---
title: VerifyingKeysRegistry Smart Contract
description: VerifyingKeysRegistry smart contract
sidebar_label: VerifyingKeysRegistry
sidebar_position: 8
---

:::info
Code location: [VerifyingKeysRegistry.sol](https://github.com/privacy-scaling-explorations/maci/blob/dev/packages/contracts/contracts/VerifyingKeysRegistry.sol)
:::

The VerifyingKeysRegistry is a contract that holds the verifying keys for the zk-SNARK circuits. It holds four different sets of keys:

- `processVks` - The keys for the processMessages circuit
- `tallyVks` - The keys for the tallyVotes circuit
- `pollJoiningVk` - The key for the poll joining circuit
- `pollJoinedVk` - The key for the poll joined circuit

Each circuit will have a signature which is its compile-time constants represented as a uint256.

Please note that each Verifying Key should be set with the corresponding mode. Available modes are quadratic voting and non quadratic voting.

The contract owner can set them using the `setVerifyingKeysBatch` function:

```ts
function setVerifyingKeysBatch(
  uint256 _stateTreeDepth,
  uint256 _intStateTreeDepth,
  uint256 _voteOptionTreeDepth,
  uint8 _messageBatchSize,
  Mode[] calldata _modes,
  VerifyingKey calldata _pollJoiningVk,
  VerifyingKey calldata _pollJoinedVk,
  VerifyingKey[] calldata _processVks,
  VerifyingKey[] calldata _tallyVks
) public onlyOwner {
  if (_modes.length != _processVks.length || _modes.length != _tallyVks.length) {
    revert InvalidKeysParams();
  }

  uint256 length = _modes.length;

  setPollJoiningVkKey(_stateTreeDepth, _pollJoiningVk);
  setPollJoinedVkKey(_stateTreeDepth, _pollJoinedVk);

  for (uint256 index = 0; index < length; ) {
    setVerifyingKeys(
      _stateTreeDepth,
      _intStateTreeDepth,
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
