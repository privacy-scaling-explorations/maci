---
title: Params Smart Contract
description: Params smart contract
sidebar_label: Params
sidebar_position: 9
---

A contract holding three structs:

```c
/// @notice A struct holding the depths of the merkle trees
struct TreeDepths {
  uint8 intStateTreeDepth;
  uint8 messageTreeSubDepth;
  uint8 messageTreeDepth;
  uint8 voteOptionTreeDepth;
}

/// @notice A struct holding the max values for the poll
struct MaxValues {
  uint256 maxMessages;
  uint256 maxVoteOptions;
}

/// @notice A struct holding the external contracts
/// that are to be passed to a Poll contract on
/// deployment
struct ExtContracts {
  IMACI maci;
}
```

Struct parameters are used to avoid stack too deep errors in the other contracts.
