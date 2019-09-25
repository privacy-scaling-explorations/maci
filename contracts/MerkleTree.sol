/*
 * semaphorejs - Zero-knowledge signaling on Ethereum
 * Copyright (C) 2019 Kobi Gurkan <kobigurk@gmail.com>
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

library MiMC {
    function MiMCpe7(uint256 in_x, uint256 in_k) public pure returns (uint256 out_x);
}

contract MerkleTree {
    uint8 treeLevel;

    uint256 internal treeRoot;
    uint256[] filledSubtrees;
    uint256[] zeros;

    uint32 nextIndex;

    uint256[] internal treeLeaves;

    event LeafAdded(uint256 leaf, uint32 leafIndex);
    event LeafUpdated(uint256 leaf, uint32 leafIndex);

    function initTree(uint8 _treeLevel, uint256 _zeroValue) public {
        require(treeLevel == 0, "MerkleTree Already Initialized");

        treeLevel = _treeLevel;

        zeros.push(_zeroValue);
        filledSubtrees.push(zeros[0]);

        for (uint8 i = 1; i < treeLevel; i++) {
            zeros.push(hashLeftRight(zeros[i-1], zeros[i-1]));
            filledSubtrees.push(zeros[i]);
        }

        treeRoot = hashLeftRight(zeros[treeLevel - 1], zeros[treeLevel - 1]);
        nextIndex = 0;
    }

    function hashLeftRight(uint256 left, uint256 right) public pure returns (uint256 mimc_hash) {
        uint256 k = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        uint256 R = 0;

        R = addmod(R, left, k);
        R = MiMC.MiMCpe7(R, 0);

        R = addmod(R, right, k);
        R = MiMC.MiMCpe7(R, 0);

        mimc_hash = R;
    }

    function insert(uint256 leaf) internal {
        uint32 leafIndex = nextIndex;
        uint32 currentIndex = nextIndex;
        nextIndex += 1;

        uint256 currentLevelHash = leaf;
        uint256 left;
        uint256 right;

        for (uint8 i = 0; i < treeLevel; i++) {
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

        treeRoot = currentLevelHash;
        treeLeaves.push(leaf);

        emit LeafAdded(leaf, leafIndex);
    }

    function update(
        uint32 leafIndex,
        uint256 leaf,
        uint256[] memory path
    ) internal {
        require(leafIndex < nextIndex, "Can't update a leaf which hasn't been inserted!");

        uint32 currentIndex = leafIndex;

        uint256 currentLevelHash = treeLeaves[leafIndex];
        uint256 left;
        uint256 right;

        for (uint8 i = 0; i < treeLevel; i++) {
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

        require(treeRoot == currentLevelHash, "MerkleTree: tree root / current level hash mismatch");

        currentIndex = leafIndex;
        currentLevelHash = leaf;

        for (uint8 i = 0; i < treeLevel; i++) {
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

        treeRoot = currentLevelHash;
        treeLeaves[leafIndex] = leaf;

        emit LeafUpdated(leaf, leafIndex);
    }
}