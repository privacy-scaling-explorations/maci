// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { AccQueue } from "../trees/AccQueue.sol";

/// @title IMACI
/// @notice MACI interface
interface IMACI {
  /// @notice Get the depth of the state tree
  /// @return The depth of the state tree
  function stateTreeDepth() external view returns (uint8);

  /// @notice Return the main root of the StateAq contract
  /// @return The Merkle root
  function getStateAqRoot() external view returns (uint256);

  /// @notice Allow Poll contracts to merge the state subroots
  /// @param _numSrQueueOps Number of operations
  /// @param _pollId The ID of the active Poll
  function mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) external;

  /// @notice Allow Poll contracts to merge the state root
  /// @param _pollId The active Poll ID
  /// @return The calculated Merkle root
  function mergeStateAq(uint256 _pollId) external returns (uint256);

  /// @notice Get the number of signups
  /// @return numsignUps The number of signups
  function numSignUps() external view returns (uint256);

  /// @notice Get the state AccQueue
  /// @return The state AccQueue
  function stateAq() external view returns (AccQueue);
}
