// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Params } from "../utilities/Params.sol";
import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title IPollFactory
/// @notice PollFactory interface
interface IPollFactory {
  /// @notice Deploy a new Poll contract
  /// @param _duration The duration of the poll
  /// @param _maxVoteOptions The max vote options for the poll
  /// @param _treeDepths The depths of the merkle trees
  /// @param _messageBatchSize The size of message batch
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _extContracts The external contract interface references
  /// @return The deployed Poll contract
  function deploy(
    uint256 _duration,
    uint256 _maxVoteOptions,
    Params.TreeDepths calldata _treeDepths,
    uint8 _messageBatchSize,
    DomainObjs.PubKey calldata _coordinatorPubKey,
    Params.ExtContracts calldata _extContracts
  ) external returns (address);
}
