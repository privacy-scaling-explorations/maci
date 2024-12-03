// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Params } from "./utilities/Params.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";
import { Poll } from "./Poll.sol";
import { IPollFactory } from "./interfaces/IPollFactory.sol";

/// @title PollFactory
/// @notice A factory contract which deploys Poll contracts. It allows the MACI contract
/// size to stay within the limit set by EIP-170.
contract PollFactory is Params, DomainObjs, IPollFactory {
  /// @notice The PollFactory constructor
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @inheritdoc IPollFactory
  function deploy(
    uint256 _duration,
    Params.TreeDepths calldata _treeDepths,
    uint8 _messageBatchSize,
    DomainObjs.PubKey calldata _coordinatorPubKey,
    Params.ExtContracts calldata _extContracts,
    uint256 _emptyBallotRoot
  ) public virtual returns (address pollAddr) {
    // deploy the poll
    Poll poll = new Poll(
      _duration,
      _treeDepths,
      _messageBatchSize,
      _coordinatorPubKey,
      _extContracts,
      _emptyBallotRoot
    );

    // init Poll
    poll.init();

    pollAddr = address(poll);
  }
}
