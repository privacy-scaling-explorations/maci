// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ISemaphore } from "../interfaces/ISemaphore.sol";

/// @title MockSemaphore
/// @notice A mock contract to test the Semaphore policy
contract MockSemaphore is ISemaphore {
  /// @notice The group id
  uint256 public immutable groupId;

  bool public valid = true;

  /// @notice Create a new instance
  /// @param _groupId The group id
  constructor(uint256 _groupId) {
    groupId = _groupId;
  }

  /// @notice mock function to flip the valid state
  function flipValid() external {
    valid = !valid;
  }

  /// @notice Verify a proof for the group
  function verifyProof(uint256 _groupId, SemaphoreProof calldata proof) external view returns (bool) {
    return valid;
  }
}
