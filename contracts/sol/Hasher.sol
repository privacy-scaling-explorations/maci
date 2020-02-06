/*
 * Hasher object to abstract out hashing logic
 * to be shared between multiple files
 *
 * This file is part of maci
 */

pragma solidity ^0.5.0;

library CircomLib {
    function MiMCSponge(uint256 xL_in, uint256 xR_in, uint256 k) public pure returns (uint256 xL, uint256 xR);
}

contract Hasher {
    function hash(uint256[] memory array) public pure returns (uint256) {
        uint256 k = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        uint256 R = 0;
        uint256 C = 0;

        for (uint256 i = 0; i < array.length; i++)
        {
            R = addmod(R, array[i], k);
            (R, C) = CircomLib.MiMCSponge(R, C, 0);
        }
        
        return R;
    }

    function hashLeftRight(uint256 left, uint256 right) public pure returns (uint256) {
        uint256[] memory arr = new uint256[](2);
        arr[0] = left;
        arr[1] = right;

        return hash(arr);
    }
}
