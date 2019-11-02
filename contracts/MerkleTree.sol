/*
 * semaphorejs - Zero-knowledge signaling on Ethereum
 * Copyright (C) 2019 Kobi Gurkan <kobigurk@gmail.com>
 * Copyright (C) 2019 Kendrick Tan <kendricktan0814@gmail.com>
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

pragma solidity 0.5.11;

import "./Whitelist.sol";

library MiMC {
    function MiMCpe7(uint256 in_x, uint256 in_k) public pure returns (uint256 out_x);
}

contract MerkleTree is Whitelist {
    // Depth of the merkle tree.
    // Number of leaves = 2^depth
    uint8 depth;

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

    constructor(uint8 _depth, uint256 _zeroValue) public {
        // Depth of the tree
        depth = _depth;
        maxLeafIndex = 2**_depth;

        // 'Caches' zero values and filledSubTrees
        // for optimized inserts later on
        zeros.push(_zeroValue);
        filledSubtrees.push(zeros[0]);

        for (uint8 i = 1; i < depth; i++) {
            zeros.push(hashPair(zeros[i-1], zeros[i-1]));
            filledSubtrees.push(zeros[i]);
        }

        // Calculate current root
        root = hashPair(zeros[depth - 1], zeros[depth - 1]);
        nextLeafIndex = 0;
    }

    function hashPair(
        uint256 left,
        uint256 right
    ) public pure returns (uint256 mimc_hash) {
        uint256 r = 15021630795539610737508582392395901278341266317943626182700664337106830745361;

        r = MiMC.MiMCpe7(r, left);
        r = MiMC.MiMCpe7(r, right);

        mimc_hash = r;
    }

    // Inserts (appends) a new leaf into the
    // merkle tree
    function insert(uint256 leaf) public whitelisted {
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

            currentLevelHash = hashPair(left, right);
            currentIndex /= 2;
        }

        root = currentLevelHash;
        leaves.push(leaf);

        emit LeafAdded(leaf, leafIndex);
    }

    // Updates leaf of merkle tree at index `leafIndex`
    function update(
        uint256 leafIndex,
        uint256 leaf,
        uint256[] memory path
    ) public whitelisted {
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

            currentLevelHash = hashPair(left, right);
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

            currentLevelHash = hashPair(left, right);
            currentIndex /= 2;
        }

        root = currentLevelHash;
        leaves[leafIndex] = leaf;

        emit LeafUpdated(leaf, leafIndex);
    }

    /*** Getters ***/
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
