/*
 * Hasher object to abstract out hashing logic
 * to be shared between multiple files
 *
 * This file is part of maci
 */

pragma solidity ^0.5.0;

import { MiMC } from './MiMC.sol';
import { SnarkConstants } from './SnarkConstants.sol';

contract Hasher is SnarkConstants {
    function hash(uint256[] memory array) public pure returns (uint256) {
        uint256 R = 0;
        uint256 C = 0;

        for (uint256 i = 0; i < array.length; i++) {
            R = addmod(R, array[i], SNARK_SCALAR_FIELD);
            (R, C) = MiMC.MiMCSponge(R, C);
        }
        
        return R;
    }

    /*
     * Concatenates and hashes two `uint256` values (left and right) using
     * a combination of MiMCSponge and `addmod`.
     * @param _left The first value
     * @param _right The second value
     * @return The uint256 hash of _left and _right
     */
    function hashLeftRight(uint256 _left, uint256 _right) public pure returns (uint256) {

        // Solidity documentation states:
        // `addmod(uint x, uint y, uint k) returns (uint)`:
        // compute (x + y) % k where the addition is performed with arbitrary
        // precision and does not wrap around at 2**256. Assert that k != 0
        // starting from version 0.5.0.

        uint256 R = _left;
        uint256 C = 0;

        (R, C) = MiMC.MiMCSponge(R, 0);

        R = addmod(R, _right, SNARK_SCALAR_FIELD);
        (R, C) = MiMC.MiMCSponge(R, C);

        return R;
    }
}
