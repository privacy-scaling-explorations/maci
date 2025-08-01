---
title: Poll Factory Smart Contract
description: Poll Factory smart contract
sidebar_label: PollFactory
sidebar_position: 3
---

:::info
Code location: [PollFactory.sol](https://github.com/privacy-scaling-explorations/maci/blob/main/packages/contracts/contracts/PollFactory.sol)
:::

`PollFactory` is a smart contract that is used to deploy new Polls. This is used by MACI inside the `deployPoll` function.

```ts
/// @inheritdoc IPollFactory
function deploy(DeployPollArgs calldata _args) public virtual returns (address pollAddr) {
  // deploy the poll
  Poll poll = new Poll(
    _args.startDate,
    _args.endDate,
    _args.treeDepths,
    _args.messageBatchSize,
    _args.coordinatorPubKey,
    _args.extContracts,
    _args.emptyBallotRoot,
    _args.pollId,
    _args.relayers,
    _args.voteOptions
  );

  pollAddr = address(poll);
}
```
