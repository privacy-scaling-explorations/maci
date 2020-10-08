// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { PoseidonT3, PoseidonT6, Hasher } from "../crypto/Hasher.sol";

contract AccQueue is Hasher {
    uint256 constant MAX_LEVELS = 32;
    uint256 internal immutable numLevels;
    uint256 internal immutable hashLength;
    uint256 public numInsertions;

    // [level index][position in hash input][leaf]
    // IMPORTANT: the following declares an array of b elements of type T:
    // T[b]
    // And the following declares an array of b elements of type T[a]:
    // T[a][b]
    // As such, the following declares an array of MAX_LEVELS+1 arrays of
    // uint256[4] arrays, **not the other way round**:
    uint256[4][MAX_LEVELS + 1] levels;

    // [level index][next index]
    uint256[MAX_LEVELS + 1] nextIndexPerLevel;

    constructor(
        uint256 _numLevels,
        uint256 _hashLength
    ) {
        require(
            _numLevels <= MAX_LEVELS,
            "AccQueue: only supports up to 32 levels"
        );
        require(
            _hashLength == 2 || _hashLength == 5,
            "AccQueue: only supports _hashLength of 2 or 5"
        );

        hashLength = _hashLength;
        numLevels = _numLevels;
    }

    // For testing only
    //function getLevelValue(uint256 x, uint256 y) public view returns (uint256) {
        //return levels[x][y];
    //}

    function isFull() public view returns (bool) {
        return numInsertions == hashLength ** numLevels;
    }

    function getRoot() public view returns (uint256) {
        require(isFull(), "AccQueue: the queue is not full");

        return levels[numLevels][0];
    }

    /*
     * Add a leaf to the queue.
     * @param _leaf The leaf to add.
     */
    function queue(uint256 _leaf) public {
        queue(_leaf, 0);
        numInsertions ++;
    }

    /*
     * A recursive function which updates the queue and hashes any subroots
     * that need to be hashed.
     * @param _leaf The leaf to add.
     */
    function queue(uint256 _leaf, uint256 _level) internal {
        if (_level > numLevels) {
            return;
        }

        uint256 n = nextIndexPerLevel[_level];

        if (n != hashLength - 1) {
            // Just store the leaf
            levels[_level][n] = _leaf;
            nextIndexPerLevel[_level] ++;

            return;
        }

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
