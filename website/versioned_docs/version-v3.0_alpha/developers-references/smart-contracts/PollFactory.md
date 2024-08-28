---
title: Poll Factory Smart Contract
description: Poll Factory smart contract
sidebar_label: PollFactory
sidebar_position: 3
---

`PollFactory` is a smart contract that is used to deploy new Polls. This is used by MACI inside the `deployPoll` function.

```ts
function deploy(
    uint256 _duration,
    uint256 _maxVoteOptions,
    TreeDepths calldata _treeDepths,
    uint8 _messageBatchSize,
    PubKey calldata _coordinatorPubKey,
    ExtContracts calldata _extContracts
  ) public virtual returns (address pollAddr) {
    /// @notice Validate _maxVoteOptions
    /// maxVoteOptions must be less than 2 ** 50 due to circuit limitations;
    /// it will be packed as a 50-bit value along with other values as one
    /// of the inputs (aka packedVal)
    if (_maxVoteOptions >= (2 ** 50)) {
      revert InvalidMaxVoteOptions();
    }

    // deploy the poll
    Poll poll = new Poll(_duration, _maxVoteOptions, _treeDepths, _messageBatchSize, _coordinatorPubKey, _extContracts);

    // init Poll
    poll.init();

    pollAddr = address(poll);
}
```
