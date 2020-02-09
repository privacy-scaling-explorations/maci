/*
 * semaphorejs - Zero-knowledge signaling on Ethereum
 * Copyright (C) 2020 Kobi Gurkan <kobigurk@gmail.com>
 * Copyright (C) 2020 Kendrick Tan <kendricktan0814@gmail.com>
 *
 * This file is part of semaphorejs.
 *
 * semaphorejs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * semaphorejs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with semaphorejs.  If not, see <http://www.gnu.org/licenses/>.
 */

pragma solidity ^0.5.0;

import { Hasher } from "./Hasher.sol";
import { Ownable } from "@openzeppelin/contracts/ownership/Ownable.sol";


contract MerkleTree is Ownable, Hasher {
    // Hasher object
    Hasher hasher;

    // Depth of the Merkle tree.
    // Number of leaves = 2^depth
    uint256 depth;

    // Current tree root
    uint256 root;

    // Value of the leaves
    uint256[] leaves;

    // Index to keep track of how many
    // leaves have been inserted in the tree
    uint256 nextLeafIndex;
    uint256 maxLeafIndex;

    // Filled 'subtrees' - used for optimized
    // inserting of new leaves
    uint256[] internal filledSubtrees;

    // Stores hashes of zeros
    uint256[] internal zeros;

    event LeafAdded(uint256 leaf, uint256 leafIndex);
    event LeafUpdated(uint256 leaf, uint256 leafIndex);

    constructor(
        uint256 _depth,
        uint256 _zeroValue
    ) public {
        // Depth of the tree
        depth = _depth;
        maxLeafIndex = 2**_depth;

        // 'Caches' zero values and filledSubTrees
        // for optimized inserts later on
        zeros.push(_zeroValue);
        filledSubtrees.push(zeros[0]);

        for (uint8 i = 1; i < depth; i++) {
            zeros.push(hashLeftRight(zeros[i-1], zeros[i-1]));
            filledSubtrees.push(zeros[i]);
        }

        // Calculate current root
        root = hashLeftRight(zeros[depth - 1], zeros[depth - 1]);
        nextLeafIndex = 0;
    }


    /*
     * Insert a new leaf
     */
    function insert(uint256 leaf) public onlyOwner {
        require(nextLeafIndex < maxLeafIndex, "Merkle Tree at max capacity");

        uint256 leafIndex = nextLeafIndex;
        uint256 currentIndex = nextLeafIndex;
        nextLeafIndex += 1;

        uint256 currentLevelHash = leaf;
        uint256 left;
        uint256 right;

        for (uint8 i = 0; i < depth; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zeros[i];

                filledSubtrees[i] = currentLevelHash;
            } else {
                left = filledSubtrees[i];
                right = currentLevelHash;
            }

            currentLevelHash = hashLeftRight(left, right);
            currentIndex /= 2;
        }

        root = currentLevelHash;
        leaves.push(leaf);

        emit LeafAdded(leaf, leafIndex);
    }

    /*
     * Make subsequent insertions start from leaf #1.
     * Leaf #0 will remain the zero value.
     */
    function insertBlankAtZerothLeaf() public onlyOwner {
        require(nextLeafIndex == 0, "MerkleTree: this function can only be called on an empty tree");
        nextLeafIndex += 1;
    }

    // Updates leaf of merkle tree at index `leafIndex`
    // TODO: remove the update function if it isn't used
    function update(
        uint256 leafIndex,
        uint256 leaf,
        uint256[] memory path
    ) public onlyOwner {
        require(leafIndex < nextLeafIndex, "Can't update a leaf which hasn't been inserted!");

        uint256 currentIndex = leafIndex;

        uint256 currentLevelHash = leaves[leafIndex];
        uint256 left;
        uint256 right;

        for (uint8 i = 0; i < depth; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = path[i];
            } else {
                left = path[i];
                right = currentLevelHash;
            }

            currentLevelHash = hashLeftRight(left, right);
            currentIndex /= 2;
        }

        require(root == currentLevelHash, "MerkleTree: tree root / current level hash mismatch");

        currentIndex = leafIndex;
        currentLevelHash = leaf;

        for (uint8 i = 0; i < depth; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = path[i];
            } else {
                left = path[i];
                right = currentLevelHash;
            }

            currentLevelHash = hashLeftRight(left, right);
            currentIndex /= 2;
        }

        root = currentLevelHash;
        leaves[leafIndex] = leaf;

        emit LeafUpdated(leaf, leafIndex);
    }

    /*
     * Destroy this contract to free up space
     */
    function selfDestruct() public onlyOwner {
        selfdestruct(0x0000000000000000000000000000000000000000);
    }

    function getRoot() public view returns (uint256) {
        return root;
    }

    function getDepth() public view returns (uint256) {
        return depth;
    }

    function getLeafAt(uint256 leafIndex) public view returns (uint256) {
        return leaves[leafIndex];
    }

    function getInsertedLeavesNo() public view returns (uint256) {
        return nextLeafIndex;
    }
}
