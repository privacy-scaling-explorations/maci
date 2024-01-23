// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { AccQueue } from "./AccQueue.sol";

/// @title AccQueueBinary
/// @notice This contract defines a Merkle tree where each leaf insertion only updates a
/// subtree. To obtain the main tree root, the contract owner must merge the
/// subtrees together. Merging subtrees requires at least 2 operations:
/// mergeSubRoots(), and merge(). To get around the gas limit,
/// the mergeSubRoots() can be performed in multiple transactions.
/// @dev This contract is for a binary tree (2 leaves per node)
abstract contract AccQueueBinary is AccQueue {
  /// @notice Create a new AccQueueBinary
  constructor(uint256 _subDepth) AccQueue(_subDepth, 2) {}

  /// @notice Hash the contents of the specified level and the specified leaf.
  /// @param _level The level to hash.
  /// @param _leaf The leaf include with the level.
  /// @return hashed The hash of the level and leaf.
  function hashLevel(uint256 _level, uint256 _leaf) internal override returns (uint256 hashed) {
    hashed = hashLeftRight(leafQueue.levels[_level][0], _leaf);

    // Free up storage slots to refund gas.
    delete leafQueue.levels[_level][0];
  }

  /// @notice Hash the contents of the specified level and the specified leaf.
  function hashLevelLeaf(uint256 _level, uint256 _leaf) public view override returns (uint256 hashed) {
    hashed = hashLeftRight(leafQueue.levels[_level][0], _leaf);
  }

  /// @notice An internal function which fills a subtree.
  /// @param _level The level at which to fill the subtree.
  function _fill(uint256 _level) internal override {
    while (_level < subDepth) {
      uint256 n = leafQueue.indices[_level];

      if (n != 0) {
        // Fill the subtree level with zeros and hash the level
        uint256 hashed;

        uint256[2] memory inputs;
        uint256 z = getZero(_level);
        inputs[0] = leafQueue.levels[_level][0];
        inputs[1] = z;
        hashed = hash2(inputs);

        // Update the subtree from the next level onwards with the new leaf
        _enqueue(hashed, _level + 1);
      }

      // Reset the current level
      delete leafQueue.indices[_level];

      _level++;
    }
  }
}
