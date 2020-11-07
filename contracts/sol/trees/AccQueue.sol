// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { PoseidonT3, PoseidonT6, Hasher } from "../crypto/Hasher.sol";
import { MerkleZeros as MerkleBinary0 } from "./zeros/MerkleBinary0.sol";
import { MerkleZeros as MerkleBinaryMaci } from "./zeros/MerkleBinaryMaci.sol";
import { MerkleZeros as MerkleQuinary0 } from "./zeros/MerkleQuinary0.sol";
import { MerkleZeros as MerkleQuinaryMaci } from "./zeros/MerkleQuinaryMaci.sol";

/*
 * This contract defines a Merkle tree where each leaf insertion only updates a
 * subtree. To obtain the main tree root, the contract owner must merge the
 * subtrees together. Merging subtrees requires at least 2 operations:
 * mergeSubRootsIntoShortestTree(), and merge(). To get around the gas limit,
 * the mergeSubRootsIntoShortestTree() can be performed in multiple transactions.
 */
abstract contract AccQueue is Ownable, Hasher {
    // The maximum tree depth
    uint256 constant MAX_DEPTH = 32;

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

    // Tracks the levels of the current subtree.
    // IMPORTANT: the following declares an array of b elements of type T: T[b]
    // And the following declares an array of b elements of type T[a]: T[a][b]
    // As such, the following declares an array of MAX_DEPTH+1 arrays of
    // uint256[4] arrays, **not the other way round**:
    uint256[4][MAX_DEPTH + 1] internal levels;

    // Tracks the next leaf index per level for the current subtree
    uint256[MAX_DEPTH + 1] internal nextIndexPerLevel;

    // Subtree roots
    mapping(uint256 => uint256) internal subRoots;

    // Merged roots
    uint256[MAX_DEPTH + 1] internal mainRoots;

    // Whether the subtrees have been merged
    bool public subTreesMerged;

    // The root of the shortest possible tree which fits all current subtree
    // roots
    uint256 internal smallSRTroot;

    // The following are used to merge the subroots into the smallSRTroot.
    
    // Tracks the levels of the small subroot tree (SRT)
    uint256[4][MAX_DEPTH + 1] internal queuedSRTlevels;

    // Tracks the next leaf index per level
    uint256[MAX_DEPTH + 1] internal queuedSRTindex;

    // Tracks the next subroot to queue
    uint256 internal nextSRindexToQueue;

    // The number of leaves inserted across all subtrees so far
    uint256 public numLeaves;

    constructor(
        uint256 _subDepth,
        uint256 _hashLength
    ) {
        require(
            _subDepth > 0,
            "AccQueue: _subDepth must be more than 0"
        );
        require(
            _subDepth <= MAX_DEPTH,
            "AccQueue: only supports up to MAX_DEPTH levels"
        );
        require(
            _hashLength == 2 || _hashLength == 5,
            "AccQueue: only supports _hashLength of 2 or 5"
        );

        isBinary = _hashLength == 2;
        subDepth = _subDepth;
        hashLength = _hashLength;
        subTreeCapacity = _hashLength ** _subDepth;
    }

    /*
     * Hash the contents of the specified level and the specified leaf.
     * This is a virtual function as the hash function which the overriding
     * contract uses will be either hashLeftRight or hash5, which require
     * different input array lengths.
     * @param _level The level to hash.
     * @param _leaf The leaf include with the level.
     */
    function hashLevel(uint256 _level, uint256 _leaf)
        virtual internal returns (uint256) {}

    /*
     * Returns the zero leaf at a specified level.
     * This is a virtual function as the hash function which the overriding
     * contract uses will be either hashLeftRight or hash5, which will produce
     * different zero values (e.g. hashLeftRight(0, 0) vs
     * hash5([0, 0, 0, 0, 0]). Moreover, the zero value may be a
     * nothing-up-my-sleeve value.
     */
    function getZero(uint256 _level) internal virtual returns (uint256) {}

    /*
     * Add a leaf to the queue for the current subtree.
     * @param _leaf The leaf to add.
     */
    function enqueue(uint256 _leaf) public {
        // Recursively queue the leaf
        queue(_leaf, 0);
        
        // Update the leaf counter
        numLeaves ++;

        // Now that a new leaf has been added, mainRoots and smallSRTroot are
        // obsolete
        delete mainRoots;
        delete smallSRTroot;
        subTreesMerged = false;

        // If a subtree is full
        if (numLeaves % subTreeCapacity == 0) {
            // Store the subroot
            subRoots[currentSubtreeIndex] = levels[subDepth][0];

            // Increment the index
            currentSubtreeIndex ++;

            // Delete ancillary data
            delete levels[subDepth][0];
            delete nextIndexPerLevel;
        }
    }

    /*
     * A recursive function which updates the queue at a given level and hashes
     * any subroots that need to be hashed.
     * @param _leaf The leaf to add.
     * @param _level The level at which to queue the leaf.
     */
    function queue(uint256 _leaf, uint256 _level) internal {
        if (_level > subDepth) {
            return;
        }

        uint256 n = nextIndexPerLevel[_level];

        if (n != hashLength - 1) {
            // Just store the leaf
            levels[_level][n] = _leaf;

            // Update the index
            nextIndexPerLevel[_level] ++;
        } else {
            // Hash the leaves
            uint256 hashed = hashLevel(_level, _leaf);

            // Reset the index for this level
            delete nextIndexPerLevel[_level];

            // Queue the hash of the leaves into to the next level
            queue(hashed, _level + 1);
        }
    }

    /*
     * Fill any empty leaves of the last subtree with zeros and store the
     * resulting subroot.
     */
    function fillLastSubTree() public onlyOwner {
        if (numLeaves % subTreeCapacity == 0) {
            // If the subtree is completely empty, then the subroot is a
            // precalculated zero value
            subRoots[currentSubtreeIndex] = getZero(subDepth);
        } else {
            // Otherwise, fill the rest of the subtree with zeros
            fillRecurse(0);

            // Store the subroot
            subRoots[currentSubtreeIndex] = levels[subDepth][0];

            // Reset the subtree data
            delete levels;

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

    /*
     * A recursive function that queues zeros to the specified level, hashes,
     * the level, and enqueues the hash to the next level.
     * @param _level The level at which to queue zeros.
     */
    function fillRecurse(uint256 _level) internal {
        if (_level > subDepth) {
            return;
        }

        uint256 n = nextIndexPerLevel[_level];

        if (n != 0) {
            // Fill the subtree level with zeros and hash the level
            uint256 hashed;

            uint256[] memory inputs = new uint256[](hashLength);
            uint256 z = getZero(_level);
            if (isBinary) {
                inputs[0] = levels[_level][0];
                inputs[1] = z;
                hashed = hash2(inputs);
            } else {
                uint8 i = 0;
                for (; i < n; i ++) {
                    inputs[i] = levels[_level][i];
                }

                for (; i < hashLength; i ++) {
                    inputs[i] = z;
                }
                hashed = hash5(inputs);
            }

            // Update the subtree from the next level onwards with the new leaf
            queue(hashed, _level + 1);

            // Reset the current level
            delete nextIndexPerLevel[_level];
        }

        // Recurse
        fillRecurse(_level + 1);
    }

    /*
     * Insert a subtree. Fills the last subtree if the last subtree is not
     * full. Used for batch insertions.
     */
    function insertSubTree(uint256 _subRoot) public onlyOwner {
        // If the current subtree is not full, fill it.
        if (numLeaves % subTreeCapacity > 0) {
            fillLastSubTree();
        }

        subRoots[currentSubtreeIndex] = _subRoot;

        // Increment the subtree index
        uint256 curr = currentSubtreeIndex + 1;
        currentSubtreeIndex = curr;

        // Update the number of leaves
        numLeaves = curr * subTreeCapacity;

        // Reset the subroot tree root now that it is obsolete
        delete smallSRTroot;

        subTreesMerged = false;
    }

    /*
     * Calculate the lowest possible height of a tree with all the subroots
     * merged together.
     */
    function calcMinHeight() public view returns (uint256) {
        uint256 depth = 1;
        while (true) {
            if (hashLength ** depth >= currentSubtreeIndex) {
                break;
            }
            depth ++;
        }

        return depth;
    }

    /*
     * Merge all subtrees to form the shortest possible tree.
     * This function can be called either once to merge all subtrees in a
     * single transaction, or multiple times to do the same in multiple
     * transactions. If _numSrQueueOps is set to 0, this function will attempt
     * to merge all subtrees in one go. If it is set to a number greater than
     * 0, it will perform up to that number of queueSubRoot() operations.
     * @param _numSrQueueOps The number of times this function will call
     *                       queueSubRoot(), up to the maximum number of times
     *                       is necessary. If it is set to 0, it will call
     *                       queueSubRoot() as many times as is necessary. Set
     *                       this to a low number and call this function
     *                       multiple times if there are many subroots to
     *                       merge, or a single transaction would run out of
     *                       gas.
     */
    function mergeSubRootsIntoShortestTree(
        uint256 _numSrQueueOps
    ) public onlyOwner {
        // This function can only be called once unless a new subtree is created
        require(subTreesMerged == false, "AccQueue: subtrees already merged");

        // There must be subtrees to merge
        require(numLeaves > 0, "AccQueue: nothing to merge");

        // Fill any empty leaves in the current subtree with zeros ony if the
        // current subtree is not full
        if (numLeaves % subTreeCapacity != 0) {
            fillLastSubTree();
        }

        // If there is only 1 subtree, use its root
        if (currentSubtreeIndex == 1) {
            smallSRTroot = getSubRoot(0);
            subTreesMerged = true;
            return;
        }

        uint256 depth = calcMinHeight();

        uint256 numQueueOps = 0;
        for (uint256 i = nextSRindexToQueue; i < currentSubtreeIndex; i ++) {
            // Stop if the limit has been reached
            if (_numSrQueueOps != 0 && numQueueOps == _numSrQueueOps) {
                return;
            }

            // Queue the next subroot
            queueSubRoot(
                getSubRoot(nextSRindexToQueue),
                0,
                depth
            );

            // Increment the next subroot counter
            nextSRindexToQueue ++;

            // Increment the ops counter
            numQueueOps ++;
        }

        // The height of the tree of subroots
        uint256 m = hashLength ** depth;

        // Queue zeroes to fill out the SRT
        if (nextSRindexToQueue == currentSubtreeIndex) {
            uint256 z = getZero(subDepth);
            for (uint256 i = currentSubtreeIndex; i < m; i ++) {
                queueSubRoot(
                    z,
                    0,
                    depth
                );
            }
        }

        // Store the smallest main root
        smallSRTroot = queuedSRTlevels[depth][0];
        subTreesMerged = true;
    }

    /*
     * A recursive function that queues a subroot into the subroot tree.
     * @param _leaf The value to queue.
     * @param _level The level at which to queue _leaf.
     * @param _maxDepth The depth of the tree.
     */
    function queueSubRoot(uint256 _leaf, uint256 _level, uint256 _maxDepth) internal {
        if (_level > _maxDepth) {
            return;
        }

        uint256 n = queuedSRTindex[_level];

        if (n != hashLength - 1) {
            // Just store the leaf
            queuedSRTlevels[_level][n] = _leaf;
            queuedSRTindex[_level] ++;
        } else {
            // Hash the elements in this level and queue it in the next level
            uint256 hashed;
            uint256[] memory inputs = new uint256[](hashLength);
            if (isBinary) {
                inputs[0] = queuedSRTlevels[_level][0];
                inputs[1] = _leaf;
                hashed = hash2(inputs);
            } else {
                for (uint8 i = 0; i < n; i ++) {
                    inputs[i] = queuedSRTlevels[_level][i];
                }
                inputs[n] = _leaf;
                hashed = hash5(inputs);
            }

            // Recurse
            delete queuedSRTindex[_level];
            queueSubRoot(hashed, _level + 1, _maxDepth);
        }
    }

    /*
     * Merge all subtrees to form a main tree with a desired depth.
     * @param _depth The depth of the main tree. It must fit all the leaves or
     *               this function will revert.
     */
    function merge(uint256 _depth) public onlyOwner {

        // The tree depth must be more than 0
        require(_depth > 0, "AccQueue: _depth must be more than 0");

        // Ensure that the subtrees have been merged
        require(subTreesMerged == true, "AccQueue: subtrees must be merged before calling merge()");

        // Check the depth
        require(_depth <= MAX_DEPTH, "AccQueue: _depth must be lte MAX_DEPTH");

        // Calculate the SRT depth
        uint256 srtDepth = subDepth;
        while (true) {
            if (hashLength ** srtDepth >= numLeaves) {
                break;
            }
            srtDepth ++;
        }

        require(
            _depth >= srtDepth,
            "AccQueue: _depth must be gte the SRT depth"
        );

        // If the depth is the same as the SRT depth, just use the SRT root
        if (_depth == srtDepth) {
            mainRoots[_depth] = smallSRTroot;
        } else {

            uint256 root = smallSRTroot;

            // Calculate the main root
            uint256[] memory inputs = new uint256[](hashLength);

            for (uint256 i = srtDepth; i < _depth; i ++) {

                uint256 z = getZero(i);

                if (isBinary) {
                    inputs[0] = root;
                    inputs[1] = z;
                    root = hash2(inputs);
                } else {
                    inputs[0] = root;
                    inputs[1] = z;
                    inputs[2] = z;
                    inputs[3] = z;
                    inputs[4] = z;
                    root = hash5(inputs);
                }
            }

            mainRoots[_depth] = root;
        }
    }

    /*
     * Returns the subroot at the specified index. Reverts if the index refers
     * to a subtree which has not been filled yet.
     * @param _index The subroot index.
     */
    function getSubRoot(uint256 _index) public view returns (uint256) {
        require(
            currentSubtreeIndex > _index,
            "AccQueue: _index must refer to a complete subtree"
        );
        return subRoots[_index];
    }

    /*
     * Returns the subroot tree (SRT) root. Its value must first be computed
     * using mergeSubRootsIntoShortestTree.
     */
    function getSmallSRTroot() public view returns (uint256) {
        require(subTreesMerged, "AccQueue: subtrees must be merged first");
        return smallSRTroot;
    }

    /*
     * Return the merged Merkle root of all the leaves at a desired depth.
     * merge() or merged(_depth) must be called first.
     * @param _depth The depth of the main tree. It must first be computed
     *               using mergeSubRootsIntoShortestTree() and merge(). 
     */
    function getMainRoot(uint256 _depth) public view returns (uint256) {
        require(
            hashLength ** _depth >= numLeaves, 
            "AccQueue: getMainRoot: _depth must be high enough"
        );

        return mainRoots[_depth];
    }
}

abstract contract AccQueueBinary is AccQueue {
    constructor(uint256 _subDepth) AccQueue(_subDepth, 2) {}

    function hashLevel(uint256 _level, uint256 _leaf) override internal returns (uint256) {
        uint256 hashed = hashLeftRight(levels[_level][0], _leaf);

        // Free up storage slots to refund gas.
        delete levels[_level][0];

        return hashed;
    }
}

abstract contract AccQueueQuinary is AccQueue {

    constructor(uint256 _subDepth) AccQueue(_subDepth, 5) {}

    function hashLevel(uint256 _level, uint256 _leaf) override internal returns (uint256) {
        uint256[] memory inputs = new uint256[](5);
        inputs[0] = levels[_level][0];
        inputs[1] = levels[_level][1];
        inputs[2] = levels[_level][2];
        inputs[3] = levels[_level][3];
        inputs[4] = _leaf;
        uint256 hashed = hash5(inputs);

        // Free up storage slots to refund gas. Note that using a loop here
        // would result in lower gas savings.
        delete levels[_level];

        return hashed;
    }
}

contract AccQueueBinary0 is AccQueueBinary, MerkleBinary0 {
    constructor(uint256 _subDepth) AccQueueBinary(_subDepth) {}
    function getZero(uint256 _level) internal view override returns (uint256) { return zeros[_level]; }
}

contract AccQueueBinaryMaci is AccQueueBinary, MerkleBinaryMaci {
    constructor(uint256 _subDepth) AccQueueBinary(_subDepth) {}
    function getZero(uint256 _level) internal view override returns (uint256) { return zeros[_level]; }
}

contract AccQueueQuinary0 is AccQueueQuinary, MerkleQuinary0 {
    constructor(uint256 _subDepth) AccQueueQuinary(_subDepth) {}
    function getZero(uint256 _level) internal view override returns (uint256) { return zeros[_level]; }
}

contract AccQueueQuinaryMaci is AccQueueQuinary, MerkleQuinaryMaci {
    constructor(uint256 _subDepth) AccQueueQuinary(_subDepth) {}
    function getZero(uint256 _level) internal view override returns (uint256) { return zeros[_level]; }
}
