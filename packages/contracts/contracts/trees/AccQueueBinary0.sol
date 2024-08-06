// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MerkleZeros as MerkleBinary0 } from "./zeros/MerkleBinary0.sol";
import { AccQueueBinary } from "./AccQueueBinary.sol";

/// @title AccQueueBinary0
/// @notice This contract extends AccQueueBinary and MerkleBinary0
/// @dev This contract is used for creating a
/// Merkle tree with binary (2 leaves per node) structure
contract AccQueueBinary0 is AccQueueBinary, MerkleBinary0 {
  /// @notice Constructor for creating AccQueueBinary0 contract
  /// @param _subDepth The depth of each subtree
  constructor(uint256 _subDepth) AccQueueBinary(_subDepth) {}

  /// @notice Returns the zero leaf at a specified level
  /// @param _level The level at which to return the zero leaf
  /// @return zero The zero leaf at the specified level
  function getZero(uint256 _level) internal view override returns (uint256 zero) {
    zero = zeros[_level];
  }
}
