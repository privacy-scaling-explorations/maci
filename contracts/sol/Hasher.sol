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
}
