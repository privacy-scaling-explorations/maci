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
    uint256 constant R = 15021630795539610737508582392395901278341266317943626182700664337106830745361;

    function hashMulti(uint256[] memory array) public pure returns (uint256) {
        uint256 r = R;

        for (uint i = 0; i < array.length; i++){
            r = MiMC.MiMCpe7(r, array[i]);
        }

        return r;
    }

    function hashPair(uint256 left, uint256 right) public pure returns (uint256) {
        uint256[] memory arr = new uint256[](2);
        arr[0] = left;
        arr[1] = right;

        return hashMulti(arr);
    }
}
