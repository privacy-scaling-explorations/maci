// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title IMessageProcessor
/// @notice MessageProcessor interface
interface IMessageProcessor {
  /// @notice Get the result of whether there are unprocessed messages left
  /// @return Whether there are unprocessed messages left
  function processingComplete() external view returns (bool);

  /// @notice Get the commitment to the state and ballot roots
  /// @return The commitment to the state and ballot roots
  function sbCommitment() external view returns (uint256);

  /// @notice Get public circuit inputs.
  /// @param _currentMessageBatchIndex The current processed batch index
  /// @param _newSbCommitment The new state root and ballot root commitment
  ///                         after all messages are processed
  /// @return publicInputs public circuit inputs
  function getPublicCircuitInputs(
    uint256 _currentMessageBatchIndex,
    uint256 _newSbCommitment
  ) external view returns (uint256[] memory);
}
