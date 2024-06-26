// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Params } from "../utilities/Params.sol";
import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title IPollFactory
/// @notice PollFactory interface
interface IPollFactory {
  /// @notice Deploy a new Poll contract
  /// @param _duration The duration of the poll
  /// @param _maxValues The max values for the poll
  /// @param _treeDepths The depths of the merkle trees
  /// @param _batchSizes The batch sizes for the poll
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _maci The MACI contract interface reference
  /// @return The deployed Poll contract
  function deploy(
    uint256 _duration,
    Params.MaxValues memory _maxValues,
    Params.TreeDepths memory _treeDepths,
    Params.BatchSizes memory _batchSizes,
    DomainObjs.PubKey memory _coordinatorPubKey,
    address _maci
  ) external returns (address);
}
