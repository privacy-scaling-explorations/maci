// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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
    uint256 _startDate,
    uint256 _endDate,
    Params.TreeDepths calldata _treeDepths,
    uint8 _messageBatchSize,
    DomainObjs.PubKey calldata _coordinatorPubKey,
    Params.ExtContracts calldata _extContracts,
    uint256 _emptyBallotRoot,
    uint256 _pollId,
    address[] calldata _relayers
  ) public virtual returns (address pollAddr) {
    // deploy the poll
    Poll poll = new Poll(
      _startDate,
      _endDate,
      _treeDepths,
      _messageBatchSize,
      _coordinatorPubKey,
      _extContracts,
      _emptyBallotRoot,
      _pollId,
      _relayers
    );

    pollAddr = address(poll);
  }
}
