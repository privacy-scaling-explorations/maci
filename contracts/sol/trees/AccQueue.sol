// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { PoseidonT3, PoseidonT6, Hasher } from "../crypto/Hasher.sol";

/*
 * This contract defines a Merkle tree where each leaf insertion only updates a
 * subtree. To obtain the main tree root, the contract owner must merge the
 * subtrees together.
 */
contract AccQueue is Ownable, Hasher {
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
    uint256[MAX_DEPTH + 1] internal subRoots;

    // The number of leaves inserted across all subtrees so far
    uint256 public numLeaves;

    constructor(
        uint256 _subDepth,
        uint256 _hashLength
    ) {
        require(
            _subDepth != 0,
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

    /*
     * Add a leaf to the queue.
     * @param _leaf The leaf to add.
     */
    function enqueue(uint256 _leaf) public {
        queue(_leaf, 0);
        numLeaves ++;

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

            uint256 hashed;
            if (hashLength == 2) {
                hashed = hashLeftRight(levels[_level][0], _leaf);

                // Free up storage slots to refund gas.
                delete levels[_level][0];
            } else {
                uint256[] memory inputs = new uint256[](5);
                inputs[0] = levels[_level][0];
                inputs[1] = levels[_level][1];
                inputs[2] = levels[_level][2];
                inputs[3] = levels[_level][3];
                inputs[4] = _leaf;
                hashed = hash5(inputs);

                // Free up storage slots to refund gas. Note that using a loop here
                // would result in lower gas savings.
                delete levels[_level][0];
                delete levels[_level][1];
                delete levels[_level][2];
                delete levels[_level][3];
            }

            delete nextIndexPerLevel[_level];

            // Recurse
            queue(hashed, _level + 1);
        }
    }

    /*
     * Insert zero values into the last subtree until it is full
     * To do so
     */
    //function fillLastSubTree() public onlyOwner {
        //if (isSubTreeFull(currentSubtreeIndex)) {
            //return;
        //}

        //for (uint8 i = 0; i < subDepth; i ++) {
        //}
    //}

    /*
     * Merge all subtrees to form the shortest possible main tree.
     */
    function merge() public onlyOwner {
    }

    /*
     * Merge all subtrees to form a main tree with a desired depth
     */
    function merge(uint256 _mainTreeDepth) public onlyOwner {
    }
}
