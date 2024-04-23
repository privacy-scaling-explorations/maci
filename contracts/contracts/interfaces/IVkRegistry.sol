// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { SnarkCommon } from "../crypto/SnarkCommon.sol";
import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title IVkRegistry
/// @notice VkRegistry interface
interface IVkRegistry {
  /// @notice Get the tally verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _mode QV or Non-QV
  /// @return The verifying key
  function getTallyVk(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    DomainObjs.Mode _mode
  ) external view returns (SnarkCommon.VerifyingKey memory);

  /// @notice Get the process verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _messageTreeDepth The message tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  /// @param _mode QV or Non-QV
  /// @return The verifying key
  function getProcessVk(
    uint256 _stateTreeDepth,
    uint256 _messageTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint256 _messageBatchSize,
    DomainObjs.Mode _mode
  ) external view returns (SnarkCommon.VerifyingKey memory);
}
