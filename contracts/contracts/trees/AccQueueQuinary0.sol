// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { MerkleZeros as MerkleQuinary0 } from "./zeros/MerkleQuinary0.sol";
import { AccQueueQuinary } from "./AccQueueQuinary.sol";

/// @title AccQueueQuinary0
/// @notice This contract extends AccQueueQuinary and MerkleQuinary0
/// @dev This contract is used for creating a
/// Merkle tree with quinary (5 leaves per node) structure
contract AccQueueQuinary0 is AccQueueQuinary, MerkleQuinary0 {
  /// @notice Constructor for creating AccQueueQuinary0 contract
  /// @param _subDepth The depth of each subtree
  constructor(uint256 _subDepth) AccQueueQuinary(_subDepth) {}

  /// @notice Returns the zero leaf at a specified level
  /// @param _level The level at which to return the zero leaf
  /// @return zero The zero leaf at the specified level
  function getZero(uint256 _level) internal view override returns (uint256 zero) {
    zero = zeros[_level];
  }
}
