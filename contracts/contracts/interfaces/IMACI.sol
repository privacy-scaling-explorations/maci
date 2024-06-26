// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IMACI
/// @notice MACI interface
interface IMACI {
  /// @notice Get the depth of the state tree
  /// @return The depth of the state tree
  function stateTreeDepth() external view returns (uint8);

  /// @notice Return the main root of the StateAq contract
  /// @return The Merkle root
  function getStateTreeRoot() external view returns (uint256);

  /// @notice Get the number of signups
  /// @return numsignUps The number of signups
  function numSignUps() external view returns (uint256);
}
