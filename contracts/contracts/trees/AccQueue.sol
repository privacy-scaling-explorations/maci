// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Hasher } from "../crypto/Hasher.sol";

/// @title AccQueue
/// @notice This contract defines a Merkle tree where each leaf insertion only updates a
/// subtree. To obtain the main tree root, the contract owner must merge the
/// subtrees together. Merging subtrees requires at least 2 operations:
/// mergeSubRoots(), and merge(). To get around the gas limit,
/// the mergeSubRoots() can be performed in multiple transactions.
abstract contract AccQueue is Ownable, Hasher {
  // The maximum tree depth
  uint256 public constant MAX_DEPTH = 32;

  /// @notice A Queue is a 2D array of Merkle roots and indices which represents nodes
  /// in a Merkle tree while it is progressively updated.
  struct Queue {
    /// @notice IMPORTANT: the following declares an array of b elements of type T: T[b]
    /// And the following declares an array of b elements of type T[a]: T[a][b]
    /// As such, the following declares an array of MAX_DEPTH+1 arrays of
    /// uint256[4] arrays, **not the other way round**:
    uint256[4][MAX_DEPTH + 1] levels;
    uint256[MAX_DEPTH + 1] indices;
  }

  // The depth of each subtree
  uint256 internal immutable subDepth;

  // The number of elements per hash operation. Should be either 2 (for
  // binary trees) or 5 (quinary trees). The limit is 5 because that is the
  // maximum supported number of inputs for the EVM implementation of the
  // Poseidon hash function
  uint256 internal immutable hashLength;

  // hashLength ** subDepth
  uint256 internal immutable subTreeCapacity;

  // True hashLength == 2, false if hashLength == 5
  bool internal isBinary;

  // The index of the current subtree. e.g. the first subtree has index 0, the
  // second has 1, and so on
  uint256 internal currentSubtreeIndex;

  // Tracks the current subtree.
  Queue internal leafQueue;

  // Tracks the smallest tree of subroots
  Queue internal subRootQueue;

  // Subtree roots
  mapping(uint256 => uint256) internal subRoots;

  // Merged roots
  uint256[MAX_DEPTH + 1] internal mainRoots;

  // Whether the subtrees have been merged
  bool public subTreesMerged;

  // Whether entire merkle tree has been merged
  bool public treeMerged;

  // The root of the shortest possible tree which fits all current subtree
  // roots
  uint256 internal smallSRTroot;

  // Tracks the next subroot to queue
  uint256 internal nextSubRootIndex;

  // The number of leaves inserted across all subtrees so far
  uint256 public numLeaves;

  /// @notice custom errors
  error SubDepthCannotBeZero();
  error SubdepthTooLarge(uint256 _subDepth, uint256 max);
  error InvalidHashLength();
  error DepthCannotBeZero();
  error SubTreesAlreadyMerged();
  error NothingToMerge();
  error SubTreesNotMerged();
  error DepthTooLarge(uint256 _depth, uint256 max);
  error DepthTooSmall(uint256 _depth, uint256 min);
  error InvalidIndex(uint256 _index);
  error InvalidLevel();

  /// @notice Create a new AccQueue
  /// @param _subDepth The depth of each subtree.
  /// @param _hashLength The number of leaves per node (2 or 5).
  constructor(uint256 _subDepth, uint256 _hashLength) payable {
    /// validation
    if (_subDepth == 0) revert SubDepthCannotBeZero();
    if (_subDepth > MAX_DEPTH) revert SubdepthTooLarge(_subDepth, MAX_DEPTH);
    if (_hashLength != 2 && _hashLength != 5) revert InvalidHashLength();

    isBinary = _hashLength == 2;
    subDepth = _subDepth;
    hashLength = _hashLength;
    subTreeCapacity = _hashLength ** _subDepth;
  }

  /// @notice Hash the contents of the specified level and the specified leaf.
  /// This is a virtual function as the hash function which the overriding
  /// contract uses will be either hashLeftRight or hash5, which require
  /// different input array lengths.
  /// @param _level The level to hash.
  /// @param _leaf The leaf include with the level.
  /// @return _hash The hash of the level and leaf.
  // solhint-disable-next-line no-empty-blocks
  function hashLevel(uint256 _level, uint256 _leaf) internal virtual returns (uint256 _hash) {}

  /// @notice Hash the contents of the specified level and the specified leaf.
  /// This is a virtual function as the hash function which the overriding
  /// contract uses will be either hashLeftRight or hash5, which require
  /// different input array lengths.
  /// @param _level The level to hash.
  /// @param _leaf The leaf include with the level.
  /// @return _hash The hash of the level and leaf.
  // solhint-disable-next-line no-empty-blocks
  function hashLevelLeaf(uint256 _level, uint256 _leaf) public view virtual returns (uint256 _hash) {}

  /// @notice Returns the zero leaf at a specified level.
  /// This is a virtual function as the hash function which the overriding
  /// contract uses will be either hashLeftRight or hash5, which will produce
  /// different zero values (e.g. hashLeftRight(0, 0) vs
  /// hash5([0, 0, 0, 0, 0]). Moreover, the zero value may be a
  /// nothing-up-my-sleeve value.
  /// @param _level The level at which to return the zero leaf.
  /// @return zero The zero leaf at the specified level.
  // solhint-disable-next-line no-empty-blocks
  function getZero(uint256 _level) internal virtual returns (uint256 zero) {}

  /// @notice Add a leaf to the queue for the current subtree.
  /// @param _leaf The leaf to add.
  /// @return leafIndex The index of the leaf in the queue.
  function enqueue(uint256 _leaf) public onlyOwner returns (uint256 leafIndex) {
    leafIndex = numLeaves;
    // Recursively queue the leaf
    _enqueue(_leaf, 0);

    // Update the leaf counter
    numLeaves = leafIndex + 1;

    // Now that a new leaf has been added, mainRoots and smallSRTroot are
    // obsolete
    delete mainRoots;
    delete smallSRTroot;
    subTreesMerged = false;

    // If a subtree is full
    if (numLeaves % subTreeCapacity == 0) {
      // Store the subroot
      subRoots[currentSubtreeIndex] = leafQueue.levels[subDepth][0];

      // Increment the index
      currentSubtreeIndex++;

      // Delete ancillary data
      delete leafQueue.levels[subDepth][0];
      delete leafQueue.indices;
    }
  }

  /// @notice Updates the queue at a given level and hashes any subroots
  /// that need to be hashed.
  /// @param _leaf The leaf to add.
  /// @param _level The level at which to queue the leaf.
  function _enqueue(uint256 _leaf, uint256 _level) internal {
    if (_level > subDepth) {
      revert InvalidLevel();
    }

    while (true) {
      uint256 n = leafQueue.indices[_level];

      if (n != hashLength - 1) {
        // Just store the leaf
        leafQueue.levels[_level][n] = _leaf;

        if (_level != subDepth) {
          // Update the index
          leafQueue.indices[_level]++;
        }

        return;
      }

      // Hash the leaves to next level
      _leaf = hashLevel(_level, _leaf);

      // Reset the index for this level
      delete leafQueue.indices[_level];

      // Queue the hash of the leaves into to the next level
      _level++;
    }
  }

  /// @notice Fill any empty leaves of the current subtree with zeros and store the
  /// resulting subroot.
  function fill() public onlyOwner {
    if (numLeaves % subTreeCapacity == 0) {
      // If the subtree is completely empty, then the subroot is a
      // precalculated zero value
      subRoots[currentSubtreeIndex] = getZero(subDepth);
    } else {
      // Otherwise, fill the rest of the subtree with zeros
      _fill(0);

      // Store the subroot
      subRoots[currentSubtreeIndex] = leafQueue.levels[subDepth][0];

      // Reset the subtree data
      delete leafQueue.levels;

      // Reset the merged roots
      delete mainRoots;
    }

    // Increment the subtree index
    uint256 curr = currentSubtreeIndex + 1;
    currentSubtreeIndex = curr;

    // Update the number of leaves
    numLeaves = curr * subTreeCapacity;

    // Reset the subroot tree root now that it is obsolete
    delete smallSRTroot;

    subTreesMerged = false;
  }

  /// @notice A function that queues zeros to the specified level, hashes,
  /// the level, and enqueues the hash to the next level.
  /// @param _level The level at which to queue zeros.
  // solhint-disable-next-line no-empty-blocks
  function _fill(uint256 _level) internal virtual {}

  /// Insert a subtree. Used for batch enqueues.
  function insertSubTree(uint256 _subRoot) public onlyOwner {
    subRoots[currentSubtreeIndex] = _subRoot;

    // Increment the subtree index
    currentSubtreeIndex++;

    // Update the number of leaves
    numLeaves += subTreeCapacity;

    // Reset the subroot tree root now that it is obsolete
    delete smallSRTroot;

    subTreesMerged = false;
  }

  /// @notice Calculate the lowest possible height of a tree with
  /// all the subroots merged together.
  /// @return depth The lowest possible height of a tree with all the
  function calcMinHeight() public view returns (uint256 depth) {
    depth = 1;
    while (true) {
      if (hashLength ** depth >= currentSubtreeIndex) {
        break;
      }
      depth++;
    }
  }

  /// @notice Merge all subtrees to form the shortest possible tree.
  /// This function can be called either once to merge all subtrees in a
  /// single transaction, or multiple times to do the same in multiple
  /// transactions.
  /// @param _numSrQueueOps The number of times this function will call
  ///                       queueSubRoot(), up to the maximum number of times
  ///                       necessary. If it is set to 0, it will call
  ///                       queueSubRoot() as many times as is necessary. Set
  ///                       this to a low number and call this function
  ///                       multiple times if there are many subroots to
  ///                       merge, or a single transaction could run out of
  ///                       gas.
  function mergeSubRoots(uint256 _numSrQueueOps) public onlyOwner {
    // This function can only be called once unless a new subtree is created
    if (subTreesMerged) revert SubTreesAlreadyMerged();

    // There must be subtrees to merge
    if (numLeaves == 0) revert NothingToMerge();

    // Fill any empty leaves in the current subtree with zeros ony if the
    // current subtree is not full
    if (numLeaves % subTreeCapacity != 0) {
      fill();
    }

    // If there is only 1 subtree, use its root
    if (currentSubtreeIndex == 1) {
      smallSRTroot = getSubRoot(0);
      subTreesMerged = true;
      return;
    }

    uint256 depth = calcMinHeight();

    uint256 queueOpsPerformed = 0;
    for (uint256 i = nextSubRootIndex; i < currentSubtreeIndex; i++) {
      if (_numSrQueueOps != 0 && queueOpsPerformed == _numSrQueueOps) {
        // If the limit is not 0, stop if the limit has been reached
        return;
      }

      // Queue the next subroot
      queueSubRoot(getSubRoot(nextSubRootIndex), 0, depth);

      // Increment the next subroot counter
      nextSubRootIndex++;

      // Increment the ops counter
      queueOpsPerformed++;
    }

    // The height of the tree of subroots
    uint256 m = hashLength ** depth;

    // Queue zeroes to fill out the SRT
    if (nextSubRootIndex == currentSubtreeIndex) {
      uint256 z = getZero(subDepth);
      for (uint256 i = currentSubtreeIndex; i < m; i++) {
        queueSubRoot(z, 0, depth);
      }
    }

    // Store the smallest main root
    smallSRTroot = subRootQueue.levels[depth][0];
    subTreesMerged = true;
  }

  /// @notice Queues a subroot into the subroot tree.
  /// @param _leaf The value to queue.
  /// @param _level The level at which to queue _leaf.
  /// @param _maxDepth The depth of the tree.
  function queueSubRoot(uint256 _leaf, uint256 _level, uint256 _maxDepth) internal {
    if (_level > _maxDepth) {
      return;
    }

    uint256 n = subRootQueue.indices[_level];

    if (n != hashLength - 1) {
      // Just store the leaf
      subRootQueue.levels[_level][n] = _leaf;
      subRootQueue.indices[_level]++;
    } else {
      // Hash the elements in this level and queue it in the next level
      uint256 hashed;
      if (isBinary) {
        uint256[2] memory inputs;
        inputs[0] = subRootQueue.levels[_level][0];
        inputs[1] = _leaf;
        hashed = hash2(inputs);
      } else {
        uint256[5] memory inputs;
        for (uint8 i = 0; i < n; i++) {
          inputs[i] = subRootQueue.levels[_level][i];
        }
        inputs[n] = _leaf;
        hashed = hash5(inputs);
      }

      // TODO: change recursion to a while loop
      // Recurse
      delete subRootQueue.indices[_level];
      queueSubRoot(hashed, _level + 1, _maxDepth);
    }
  }

  /// @notice Merge all subtrees to form a main tree with a desired depth.
  /// @param _depth The depth of the main tree. It must fit all the leaves or
  ///               this function will revert.
  /// @return root The root of the main tree.
  function merge(uint256 _depth) public onlyOwner returns (uint256 root) {
    // The tree depth must be more than 0
    if (_depth == 0) revert DepthCannotBeZero();

    // Ensure that the subtrees have been merged
    if (!subTreesMerged) revert SubTreesNotMerged();

    // Check the depth
    if (_depth > MAX_DEPTH) revert DepthTooLarge(_depth, MAX_DEPTH);

    // Calculate the SRT depth
    uint256 srtDepth = subDepth;
    while (true) {
      if (hashLength ** srtDepth >= numLeaves) {
        break;
      }
      srtDepth++;
    }

    if (_depth < srtDepth) revert DepthTooSmall(_depth, srtDepth);

    // If the depth is the same as the SRT depth, just use the SRT root
    if (_depth == srtDepth) {
      mainRoots[_depth] = smallSRTroot;
      treeMerged = true;
      return smallSRTroot;
    } else {
      root = smallSRTroot;

      // Calculate the main root

      for (uint256 i = srtDepth; i < _depth; i++) {
        uint256 z = getZero(i);

        if (isBinary) {
          uint256[2] memory inputs;
          inputs[0] = root;
          inputs[1] = z;
          root = hash2(inputs);
        } else {
          uint256[5] memory inputs;
          inputs[0] = root;
          inputs[1] = z;
          inputs[2] = z;
          inputs[3] = z;
          inputs[4] = z;
          root = hash5(inputs);
        }
      }

      mainRoots[_depth] = root;
      treeMerged = true;
    }
  }

  /// @notice Returns the subroot at the specified index. Reverts if the index refers
  /// to a subtree which has not been filled yet.
  /// @param _index The subroot index.
  /// @return subRoot The subroot at the specified index.
  function getSubRoot(uint256 _index) public view returns (uint256 subRoot) {
    if (currentSubtreeIndex <= _index) revert InvalidIndex(_index);
    subRoot = subRoots[_index];
  }

  /// @notice Returns the subroot tree (SRT) root. Its value must first be computed
  /// using mergeSubRoots.
  /// @return smallSubTreeRoot The SRT root.
  function getSmallSRTroot() public view returns (uint256 smallSubTreeRoot) {
    if (!subTreesMerged) revert SubTreesNotMerged();
    smallSubTreeRoot = smallSRTroot;
  }

  /// @notice Return the merged Merkle root of all the leaves at a desired depth.
  /// @dev merge() or merged(_depth) must be called first.
  /// @param _depth The depth of the main tree. It must first be computed
  ///               using mergeSubRoots() and merge().
  /// @return mainRoot The root of the main tree.
  function getMainRoot(uint256 _depth) public view returns (uint256 mainRoot) {
    if (hashLength ** _depth < numLeaves) revert DepthTooSmall(_depth, numLeaves);

    mainRoot = mainRoots[_depth];
  }

  /// @notice Get the next subroot index and the current subtree index.
  function getSrIndices() public view returns (uint256 next, uint256 current) {
    next = nextSubRootIndex;
    current = currentSubtreeIndex;
  }
}
