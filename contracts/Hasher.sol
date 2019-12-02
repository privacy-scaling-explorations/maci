/*
 * Hasher object to abstract out hashing logic
 * to be shared between multiple files
 *
 * This file is part of maci
 */

pragma solidity 0.5.11;

library MiMC {
    function MiMCpe7(uint256 in_x, uint256 in_k) public pure returns (uint256 out_x);
}

contract Hasher {
    uint256 constant R = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    function hashMulti(uint256[] memory array, uint256 key) public pure returns (uint256) {
        uint256 r = key;

        for (uint256 i = 0; i < array.length; i++)
        {
            r = (r + array[i] + MiMC.MiMCpe7(array[i], r)) % R;
        }
        
        return r;
    }

    function hashPair(uint256 left, uint256 right) public pure returns (uint256) {
        uint256[] memory arr = new uint256[](2);
        arr[0] = left;
        arr[1] = right;

        return hashMulti(arr, 0);
    }
}
