// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IMACI } from "./interfaces/IMACI.sol";
import { Params } from "./utilities/Params.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";
import { Poll } from "./Poll.sol";
import { IPollFactory } from "./interfaces/IPollFactory.sol";

/// @title PollFactory
/// @notice A factory contract which deploys Poll contracts. It allows the MACI contract
/// size to stay within the limit set by EIP-170.
contract PollFactory is Params, DomainObjs, IPollFactory {
  // custom error
  error InvalidMaxVoteOptions();

  /// @notice The PollFactory constructor
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @inheritdoc IPollFactory
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
}
