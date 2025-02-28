---
title: MessageProcessor Smart Contract
description: MessageProcessor smart contract
sidebar_label: MessageProcessor
sidebar_position: 4
---

:::info
Code location: [MessageProcessor.sol](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/MessageProcessor.sol)
:::

This contract is used to prepare parameters for the zk-SNARK circuits as well as for verifying proofs. It should be deployed alongside a `Poll` and ownership assigned to the coordinator.
It will process messages in batches, and after all batches have been processed, the `sbCommitment` can then be used for the `Tally` contract verification steps.
