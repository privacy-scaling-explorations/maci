---
title: Params Smart Contract
description: Params smart contract
sidebar_label: Params
sidebar_position: 9
---

:::info
Code location: [Params.sol](https://github.com/privacy-scaling-explorations/maci/blob/main/packages/contracts/contracts/utilities/Params.sol)
:::

A contract holding three structs:

```ts
/// @notice A struct holding the depths of the merkle trees
struct TreeDepths {
  uint8 tallyProcessingStateTreeDepth;
  uint8 voteOptionTreeDepth;
}

/// @notice A struct holding the external contracts
/// that are to be passed to a Poll contract on
/// deployment
struct ExtContracts {
  IMACI maci;
  IVerifier verifier;
  IVkRegistry vkRegistry;
  IBasePolicy policy;
  IInitialVoiceCreditProxy initialVoiceCreditProxy;
}
```

Struct parameters are used to avoid stack too deep errors in the other contracts.
