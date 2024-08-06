---
title: Params Smart Contract
description: Params smart contract
sidebar_label: Params
sidebar_position: 9
---

:::info
Code location: [Params.sol](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/utils/Params.sol)
:::

A contract holding three structs:

```c
/// @notice A struct holding the depths of the merkle trees
struct TreeDepths {
  uint8 intStateTreeDepth;
  uint8 messageTreeSubDepth;
  uint8 messageTreeDepth;
  uint8 voteOptionTreeDepth;
}

/// @notice A struct holding the external contracts
/// that are to be passed to a Poll contract on
/// deployment
struct ExtContracts {
  IMACI maci;
  AccQueue messageAq;
}
```

Struct parameters are used to avoid stack too deep errors in the other contracts.
