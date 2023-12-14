// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { VkRegistry } from "../VkRegistry.sol";
import { AccQueue } from "../trees/AccQueue.sol";

/// @title IMACI interface
interface IMACI {
  /// @notice Get the depth of the state tree
  /// @return The depth of the state tree
  function stateTreeDepth() external view returns (uint8);

  /// @notice Get the root of the state accumulator queue
  /// @return The root of the state accumulator queue
  function getStateAqRoot() external view returns (uint256);

  /// @notice Merge the sub roots of the state accumulator queue
  /// @param _numSrQueueOps The number of queue operations
  /// @param _pollId The poll identifier
  function mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) external;

  /// @notice Merge the state accumulator queue
  /// @param _pollId The poll identifier
  /// @return The new root of the state accumulator queue after merging
  function mergeStateAq(uint256 _pollId) external returns (uint256);

  /// @notice Get the number of signups
  /// @return The number of signups
  function numSignUps() external view returns (uint256);

  /// @notice Get the state accumulator queue
  /// @return The state accumulator queue
  function stateAq() external view returns (AccQueue);
}
