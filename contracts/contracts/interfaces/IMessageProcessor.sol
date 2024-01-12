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
}
