---
title: Poll Factory Smart Contract
description: Poll Factory smart contract
sidebar_label: PollFactory
sidebar_position: 3
---

:::info
Code location: [PollFactory.sol](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/PollFactory.sol)
:::

`PollFactory` is a smart contract that is used to deploy new Polls. This is used by MACI inside the `deployPoll` function.

```ts
function deploy(
    _duration,
    TreeDepths calldata _treeDepths,
    PubKey calldata _coordinatorPubKey,
    address _maci
) public virtual returns (address pollAddr) {
    /// @notice deploy a new AccQueue contract to store messages
    AccQueue messageAq = new AccQueueQuinaryMaci(_treeDepths.messageTreeSubDepth);

    /// @notice the smart contracts that a Poll would interact with
    ExtContracts memory extContracts = ExtContracts({ maci: IMACI(_maci), messageAq: messageAq });

    // deploy the poll
    Poll poll = new Poll(_duration, _treeDepths, _coordinatorPubKey, extContracts);

    // Make the Poll contract own the messageAq contract, so only it can
    // run enqueue/merge
    messageAq.transferOwnership(address(poll));

    // init Poll
    poll.init();

    pollAddr = address(poll);
  }
```

Upon deployment, the following will happen:

- ownership of the `messageAq` contract is transferred to the deployed poll contract
