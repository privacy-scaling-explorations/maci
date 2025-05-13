// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SnarkCommon } from "../crypto/SnarkCommon.sol";
import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title IVerifyingKeysRegistry
/// @notice VerifyingKeysRegistry interface
interface IVerifyingKeysRegistry {
  struct SetVerifyingKeysBatchArgs {
    /// @param stateTreeDepth The state tree depth
    uint256 stateTreeDepth;
    /// @param pollStateTreeDepth The poll state tree depth
    uint256 pollStateTreeDepth;
    /// @param tallyProcessingStateTreeDepth The intermediate state tree depth
    uint256 tallyProcessingStateTreeDepth;
    /// @param voteOptionTreeDepth The vote option tree depth
    uint256 voteOptionTreeDepth;
    /// @param messageBatchSize The message batch size
    uint8 messageBatchSize;
    /// @param modes Array of QV, Non-QV or Full modes (must have the same length as process and tally keys)
    DomainObjs.Mode[] modes;
    /// @param pollJoiningVerifyingKey The poll joining verifying key
    SnarkCommon.VerifyingKey pollJoiningVerifyingKey;
    /// @param pollJoinedVerifyingKey The poll joined verifying key
    SnarkCommon.VerifyingKey pollJoinedVerifyingKey;
    /// @param processVerifyingKeys The process verifying keys (must have the same length as modes)
    SnarkCommon.VerifyingKey[] processVerifyingKeys;
    /// @param tallyVerifyingKeys The tally verifying keys (must have the same length as modes)
    SnarkCommon.VerifyingKey[] tallyVerifyingKeys;
  }

  /// @notice Get the tally verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _mode QV, Non-QV, Full
  /// @return The verifying key
  function getTallyVerifyingKey(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    DomainObjs.Mode _mode
  ) external view returns (SnarkCommon.VerifyingKey memory);

  /// @notice Get the process verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  /// @param _mode QV, Non-QV, Full
  /// @return The verifying key
  function getProcessVerifyingKey(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize,
    DomainObjs.Mode _mode
  ) external view returns (SnarkCommon.VerifyingKey memory);

  /// @notice Get the poll joining verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @return The verifying key
  function getPollJoiningVerifyingKey(uint256 _stateTreeDepth) external view returns (SnarkCommon.VerifyingKey memory);

  /// @notice Get the poll joined verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @return The verifying key
  function getPollJoinedVerifyingKey(uint256 _stateTreeDepth) external view returns (SnarkCommon.VerifyingKey memory);
}
