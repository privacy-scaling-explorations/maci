// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MerkleZeros as MerkleBinaryMaci } from "./zeros/MerkleBinaryMaci.sol";
import { AccQueueBinary } from "./AccQueueBinary.sol";

/// @title AccQueueBinaryMaci
/// @notice This contract extends AccQueueBinary and MerkleBinaryMaci
/// @dev This contract is used for creating a
/// Merkle tree with binary (2 leaves per node) structure
contract AccQueueBinaryMaci is AccQueueBinary, MerkleBinaryMaci {
  /// @notice Constructor for creating AccQueueBinaryMaci contract
  /// @param _subDepth The depth of each subtree
  constructor(uint256 _subDepth) AccQueueBinary(_subDepth) {}

  /// @notice Returns the zero leaf at a specified level
  /// @param _level The level at which to return the zero leaf
  function getZero(uint256 _level) internal view override returns (uint256 zero) {
    zero = zeros[_level];
  }
}
