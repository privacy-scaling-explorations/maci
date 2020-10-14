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
 * subtrees together.
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

    // The current subtree index. e.g. the first subtree has index 0, the
    // second has 1, and so on
    uint256 internal currentSubtreeIndex;

    // [level index][position in hash input][leaf]
    // IMPORTANT: the following declares an array of b elements of type T: T[b]
    // And the following declares an array of b elements of type T[a]: T[a][b]
    // As such, the following declares an array of MAX_DEPTH+1 arrays of
    // uint256[4] arrays, **not the other way round**:
    uint256[4][MAX_DEPTH + 1] internal levels;

    // The next leaf index per level for the current subtree
    uint256[MAX_DEPTH + 1] internal nextIndexPerLevel;

    // Subtree roots
    mapping(uint256 => uint256) internal subRoots;

    // Merged roots
    uint256[MAX_DEPTH] internal mainRoots;

    // Whether the subtrees have been merged
    bool public subTreesMerged;

    // The root of the shortest possible tree which fits all subtree roots
    uint256 internal smallSRTroot;

    uint256[4][MAX_DEPTH + 1] internal queuedSRTlevels;
    uint256[MAX_DEPTH + 1] internal queuedSRTindex;
    uint256 internal nextSRindexToQueue;

    // True hashLength == 2, false if hashLength == 5
    bool internal isBinary;

    // The number of leaves inserted across all subtrees so far
    uint256 public numLeaves;

    constructor(
        uint256 _subDepth,
        uint256 _hashLength
    ) {
        require(
            _subDepth > 0,
            "AccQueue: the tree depths must be more than 0"
        );
        require(
            _subDepth <= MAX_DEPTH,
            "AccQueue: only supports up to 32 levels"
        );
        require(
            _hashLength == 2 || _hashLength == 5,
            "AccQueue: only supports _hashLength of 2 or 5"
        );

        subDepth = _subDepth;
        hashLength = _hashLength;
        isBinary = _hashLength == 2;
    }

    function isFull() public view returns (bool) {
        return numLeaves > 0 && numLeaves % (hashLength ** subDepth) == 0;
    }

    function isSubTreeFull(uint256 _index) public view returns (bool) {
        return numLeaves >= (_index + 1) * (hashLength ** subDepth);
    }

    function getSubRoot(uint256 _index) public view returns (uint256) {
        require(
            isSubTreeFull(_index),
            "AccQueue: _index must refer to a complete subtree"
        );
        return subRoots[_index];
    }

    function hash(uint256 _level, uint256 _leaf) virtual internal returns (uint256) {}

    function getZero(uint256 _level) internal virtual returns (uint256) {}

    /*
     * Add a leaf to the queue.
     * @param _leaf The leaf to add.
     */
    function enqueue(uint256 _leaf) public {
        queue(_leaf, 0);
        numLeaves ++;
        delete mainRoots;
        delete smallSRTroot;

        uint256 subTreeCapacity = hashLength ** subDepth;
        if (numLeaves % subTreeCapacity == 0) {
            subRoots[currentSubtreeIndex] = levels[subDepth][0];
            currentSubtreeIndex ++;
            delete levels[subDepth][0];
            delete nextIndexPerLevel;
        }
    }

    /*
     * A recursive function which updates the queue and hashes any subroots
     * that need to be hashed.
     * @param _leaf The leaf to add.
     */
    function queue(uint256 _leaf, uint256 _level) internal {
        if (_level > subDepth) {
            return;
        }

        uint256 n = nextIndexPerLevel[_level];

        if (n != hashLength - 1) {
            // Just store the leaf
            levels[_level][n] = _leaf;
            nextIndexPerLevel[_level] ++;

            return;
        } else {

            uint256 hashed = hash(_level, _leaf);

            delete nextIndexPerLevel[_level];

            // Recurse
            queue(hashed, _level + 1);
        }
    }

    /*
     * Fill any empty leaves of the last subtree with zeros and store the
     * resulting subroot.
     */
    function fillLastSubTree() public onlyOwner {
        // The total capacity of the subtree
        uint256 subTreeCapacity = hashLength ** subDepth;

        if (numLeaves % subTreeCapacity == 0) {
            // If the subtree is completely empty, then the subroot is a
            // precalculated zero value
            subRoots[currentSubtreeIndex] = getZero(subDepth);
        } else {
            // Recurse
            fillRecurse(0);

            // Store the subroot
            subRoots[currentSubtreeIndex] = levels[subDepth][0];

            // Blank out the subtree data
            for (uint8 i = 0; i < subDepth + 1; i ++) {
                // TODO: test if `delete levels[i]` is sufficient
                if (isBinary) {
                    delete levels[i][0];
                } else {
                    delete levels[i][0];
                    delete levels[i][1];
                    delete levels[i][2];
                    delete levels[i][3];
                }
            }

            // Blank out the merged roots
            delete mainRoots;
        }

        // Update the subtree index
        currentSubtreeIndex ++;

        // Update the number of leaves
        numLeaves = currentSubtreeIndex * subTreeCapacity;

        delete smallSRTroot;
    }

    function fillRecurse(uint256 _level) internal {
        if (_level > subDepth) {
            return;
        }

        uint256 n = nextIndexPerLevel[_level];

        if (n != 0) {
            // Fill the subtree level and hash the level
            uint256 hashed;
            if (isBinary) {
                hashed = hashLeftRight(levels[_level][0], getZero(_level));
            } else {
                uint256[] memory inputs = new uint256[](5);
                for (uint8 i = 0; i < n; i ++) {
                    inputs[i] = levels[_level][i];
                }
                for (uint256 i = n; i < hashLength; i ++) {
                    inputs[i] = getZero(_level);
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
     * Calculate the lowest possible height of a tree with all the subroots
     * merged together
     */
    function calcMinHeight() public view returns (uint256) {
        uint256 depth = subDepth;
        uint256 max;
        while (true) {
            max = hashLength ** depth;
            if (max >= numLeaves) {
                break;
            }
            depth ++;
        }

        return depth;
    }

    /*
     * Merge all subtrees to form the shortest possible tree.
     */
    function mergeSubRootsIntoShortestTree(
        uint256 _numSrQueueOps
    ) public onlyOwner {
        // This function can only be called once unless a new subtree is created
        require(subTreesMerged == false, "AccQueue: subtrees already merged");

        // There must be subtrees to merge
        require(numLeaves > 0, "AccQueue: nothing to merge");

        // Fill any empty leaves in the last subtree with zeros
        if (numLeaves % (hashLength ** subDepth) != 0) {
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
                depth - subDepth
            );

            // Increment the next subroot counter
            nextSRindexToQueue ++;
            numQueueOps ++;
        }

        uint256 m = hashLength ** (depth - subDepth);

        if (nextSRindexToQueue == currentSubtreeIndex) {
            for (uint256 i = currentSubtreeIndex; i < m; i ++) {
                queueSubRoot(
                    getZero(depth - subDepth),
                    0,
                    depth - subDepth
                );
            }

            // Store the smallest main root
            smallSRTroot = queuedSRTlevels[depth - subDepth][0];
            subTreesMerged = true;
        }
    }

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
            if (isBinary) {
                hashed = hashLeftRight(queuedSRTlevels[_level][0], _leaf);
            } else {
                uint256[] memory inputs = new uint256[](5);
                for (uint8 i = 0; i < n; i ++) {
                    inputs[i] = queuedSRTlevels[_level][i];
                }
                inputs[n] = _leaf;
                hashed = hash5(inputs);
            }

            // Recurse
            queuedSRTindex[_level] = 0;
            queueSubRoot(hashed, _level + 1, _maxDepth);
        }
    }

    /*
     * Merge all subtrees to form a main tree with a desired depth
     */
    function merge(uint256 _depth) public onlyOwner {
        require(subTreesMerged == true, "AccQueue: subtrees must be merged before calling merge()");
        require(_depth >= subDepth, "AccQueue: _depth must be gte subDepth");
        require(_depth <= MAX_DEPTH, "AccQueue: _depth must be lte MAX_DEPTH");

        if (_depth == subDepth) {
            mainRoots[_depth] = smallSRTroot;
        }

        uint256 root = smallSRTroot;
        for (uint256 i = subDepth; i < _depth; i ++) {
            uint256 z = getZero(_depth - i);
            if (isBinary) {
                root = hashLeftRight(root, getZero(_depth - i));
            } else {
                uint256[] memory inputs = new uint256[](5);
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


    function getSmallSRTroot() public view returns (uint256) {
        require(subTreesMerged, "AccQueue: subtrees must be merged first");
        return smallSRTroot;
    }

    /*
     * Return the merged Merkle root of all the leaves at a desired depth.
     * merge() or merged(_depth) must be called first.
     */
    function getMainRoot(uint256 _depth) public view returns (uint256) {
        require(
            _depth ** hashLength >= numLeaves,
            "AccQueue: getMainRoot: _depth must be high enough"
        );

        return mainRoots[_depth];
    }
}

abstract contract AccQueueBinary is AccQueue {
    constructor(uint256 _subDepth) AccQueue(_subDepth, 2) {}

    function hash(uint256 _level, uint256 _leaf) override internal returns (uint256) {
        uint256 hashed = hashLeftRight(levels[_level][0], _leaf);

        // Free up storage slots to refund gas.
        delete levels[_level][0];

        return hashed;
    }
}

abstract contract AccQueueQuinary is AccQueue {

    constructor(uint256 _subDepth) AccQueue(_subDepth, 5) {}

    function hash(uint256 _level, uint256 _leaf) override internal returns (uint256) {
        uint256[] memory inputs = new uint256[](5);
        inputs[0] = levels[_level][0];
        inputs[1] = levels[_level][1];
        inputs[2] = levels[_level][2];
        inputs[3] = levels[_level][3];
        inputs[4] = _leaf;
        uint256 hashed = hash5(inputs);

        // Free up storage slots to refund gas. Note that using a loop here
        // would result in lower gas savings.
        delete levels[_level][0];
        delete levels[_level][1];
        delete levels[_level][2];
        delete levels[_level][3];

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
