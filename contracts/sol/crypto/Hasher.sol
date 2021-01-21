// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;
import { SnarkConstants } from "./SnarkConstants.sol";

library PoseidonT3 {
    function poseidon(uint256[] memory input) public pure returns (uint256) {}
}

library PoseidonT4 {
    function poseidon(uint256[] memory input) public pure returns (uint256) {}
}

library PoseidonT5 {
    function poseidon(uint256[] memory input) public pure returns (uint256) {}
}

library PoseidonT6 {
    function poseidon(uint256[] memory input) public pure returns (uint256) {}
}

/*
 * A SHA256 hash function for any number of input elements, and Poseidon hash
 * functions for 2, 3, 4, 5, and 12 input elements.
 */
contract Hasher is SnarkConstants {
    function sha256Hash(uint256[] memory array) public pure returns (uint256) {
        return uint256(sha256(abi.encodePacked(array))) % SNARK_SCALAR_FIELD;
    }

    function hash2(uint256[] memory array) public pure returns (uint256) {
        return PoseidonT3.poseidon(array);
    }

    function hash3(uint256[] memory array) public pure returns (uint256) {
        return PoseidonT4.poseidon(array);
    }

    function hash4(uint256[] memory array) public pure returns (uint256) {
        return PoseidonT5.poseidon(array);
    }

    function hash5(uint256[] memory array) public pure returns (uint256) {
        return PoseidonT6.poseidon(array);
    }

    //function hash12(uint256[] memory array) public pure returns (uint256) {
        ///*
        //To hash 12 elements [a ... l]:
            //m: hash4(
                //n: hash5([a, b, c, d e]),
                //o: hash5([f, g, h, i j]),
                //k,
                //l
            //)
        //*/

        //uint256[] memory input12 = new uint256[](12);
        //for (uint256 i = 0; i < array.length; i++) {
            //input12[i] = array[i];
        //}

        //// If fewer than 12 elements are given, use the value 0
        //for (uint256 i = array.length; i < 12; i++) {
            //input12[i] = 0;
        //}

        //uint256[] memory n = new uint256[](5);
        //n[0] = input12[0];
        //n[1] = input12[1];
        //n[2] = input12[2];
        //n[3] = input12[3];
        //n[4] = input12[4];

        //uint256[] memory o = new uint256[](5);
        //o[0] = input12[5];
        //o[1] = input12[6];
        //o[2] = input12[7];
        //o[3] = input12[8];
        //o[4] = input12[9];

        //uint256[] memory m = new uint256[](4);
        //m[0] = PoseidonT6.poseidon(n);
        //m[1] = PoseidonT6.poseidon(o);
        //m[2] = input12[10];
        //m[3] = input12[11];

        //return PoseidonT5.poseidon(m);
    //}

    function hashLeftRight(uint256 _left, uint256 _right)
    public
    pure
    returns (uint256)
    {
        uint256[] memory input = new uint256[](2);
        input[0] = _left;
        input[1] = _right;
        return hash2(input);
    }
}
